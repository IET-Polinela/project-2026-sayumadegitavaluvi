from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import TemplateView, ListView, DetailView, CreateView, UpdateView, DeleteView
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.http import JsonResponse, HttpResponseForbidden
from django.db.models import Q

from .models import Report
from .forms import ReportForm


class AdminRequiredMixin(LoginRequiredMixin, UserPassesTestMixin):
    login_url = 'login'

    def test_func(self):
        return self.request.user.is_authenticated and self.request.user.is_admin

    def handle_no_permission(self):
        if not self.request.user.is_authenticated:
            messages.error(self.request, 'Silakan login terlebih dahulu.')
            return redirect('login')

        messages.error(self.request, 'Akses Ditolak. Hanya admin yang dapat melakukan aksi ini.')
        return redirect('report_list')


def get_next_status_action(status):
    transitions = {
        'REPORTED': {'value': 'VERIFIED', 'label': 'Verifikasi'},
        'VERIFIED': {'value': 'IN_PROGRESS', 'label': 'Progress'},
        'IN_PROGRESS': {'value': 'RESOLVED', 'label': 'Selesai'},
    }
    return transitions.get(status)


def get_visible_reports_for_user(user):
    public_statuses = [
        'REPORTED',
        'VERIFIED',
        'IN_PROGRESS',
        'RESOLVED'
    ]

    if user.is_authenticated and user.is_admin:
        return Report.objects.exclude(status='DRAFT')

    if user.is_authenticated:
        return Report.objects.filter(
            Q(status__in=public_statuses) |
            Q(reporter=user, status='DRAFT')
        )

    return Report.objects.filter(status__in=public_statuses)


def serialize_report_row(report):
    return {
        'id': report.id,
        'title': report.title,
        'location': report.location,
        'status': report.status,
        'status_display': report.get_status_display(),
        'next_action': get_next_status_action(report.status),
    }


class HomePageView(TemplateView):
    template_name = 'main_app/index.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        reports = Report.objects.all()

        context['total_reports'] = reports.count()
        context['resolved_reports'] = reports.filter(status='RESOLVED').count()
        context['in_progress_reports'] = reports.filter(status='IN_PROGRESS').count()
        context['active_categories'] = reports.exclude(category='').values('category').distinct().count()

        context['road_reports'] = reports.filter(category='Jalan Rusak').count()
        context['lamp_reports'] = reports.filter(category='Lampu Jalan').count()
        context['drainage_reports'] = reports.filter(category='Drainase').count()
        context['trash_reports'] = reports.filter(category='Sampah').count()
        context['security_reports'] = reports.filter(category='Keamanan').count()
        context['other_reports'] = reports.filter(category='Lainnya').count()

        context['recent_reports'] = reports.exclude(status='DRAFT').order_by('-created_at')[:3]

        return context


class ReportListView(ListView):
    model = Report
    template_name = 'main_app/home.html'
    context_object_name = 'reports'

    def get_queryset(self):
        return get_visible_reports_for_user(self.request.user).order_by('-created_at')


class ReportDetailView(DetailView):
    model = Report
    template_name = 'main_app/detail_report.html'
    context_object_name = 'report'

    def get_queryset(self):
        return get_visible_reports_for_user(self.request.user)


class ReportCreateView(LoginRequiredMixin, CreateView):
    model = Report
    form_class = ReportForm
    template_name = 'main_app/add_report.html'
    success_url = reverse_lazy('report_list')
    login_url = 'login'

    def form_valid(self, form):
        form.instance.reporter = self.request.user

        if not self.request.user.is_admin:
            form.instance.status = 'REPORTED'

        messages.success(self.request, 'Laporan berhasil ditambahkan.')
        return super().form_valid(form)


class ReportUpdateView(AdminRequiredMixin, UpdateView):
    model = Report
    form_class = ReportForm
    template_name = 'main_app/edit_report.html'
    success_url = reverse_lazy('report_list')

    def dispatch(self, request, *args, **kwargs):
        return HttpResponseForbidden('Admin tidak diperbolehkan mengedit isi laporan warga.')


class ReportDeleteView(AdminRequiredMixin, DeleteView):
    model = Report
    template_name = 'main_app/delete_report.html'
    context_object_name = 'report'
    success_url = reverse_lazy('report_list')

    def dispatch(self, request, *args, **kwargs):
        return HttpResponseForbidden('Admin tidak diperbolehkan menghapus laporan warga.')


class ReportUpdateStatusView(AdminRequiredMixin, View):
    def post(self, request, pk):
        report = get_object_or_404(Report, pk=pk)
        new_status = request.POST.get('status')

        transitions = {
            'REPORTED': 'VERIFIED',
            'VERIFIED': 'IN_PROGRESS',
            'IN_PROGRESS': 'RESOLVED',
        }

        if transitions.get(report.status) == new_status:
            report.status = new_status
            report.save()
            messages.success(request, 'Status laporan berhasil diperbarui.')
        else:
            messages.error(request, 'Perubahan status tidak valid.')

        return redirect('report_list')


class ReportSearchView(View):
    def get(self, request, *args, **kwargs):
        query = request.GET.get('q', '').strip()

        reports = get_visible_reports_for_user(request.user).order_by('-created_at')

        if query:
            reports = reports.filter(
                Q(title__icontains=query) |
                Q(category__icontains=query) |
                Q(location__icontains=query) |
                Q(status__icontains=query)
            )

        data = {
            'is_admin': request.user.is_authenticated and getattr(request.user, 'is_admin', False),
            'results': [serialize_report_row(report) for report in reports]
        }

        return JsonResponse(data)


class ReportDetailJsonView(View):
    def get(self, request, pk, *args, **kwargs):
        report = get_object_or_404(
            get_visible_reports_for_user(request.user),
            pk=pk
        )

        data = {
            'id': report.id,
            'title': report.title,
            'category': report.category,
            'description': report.description,
            'location': report.location,
            'status': report.status,
            'status_display': report.get_status_display(),
            'created_at': report.created_at.strftime('%d-%m-%Y %H:%M'),
        }

        return JsonResponse(data)