from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views import View
from django.views.generic import TemplateView, ListView, DetailView, CreateView, UpdateView, DeleteView
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.http import JsonResponse
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
        'VERIFIED': {'value': 'IN_PROGRESS', 'label': 'In Progress'},
        'IN_PROGRESS': {'value': 'RESOLVED', 'label': 'Selesaikan'},
    }
    return transitions.get(status)


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


class ReportListView(ListView):
    model = Report
    template_name = 'main_app/home.html'
    context_object_name = 'reports'
    ordering = ['-created_at']


class ReportDetailView(DetailView):
    model = Report
    template_name = 'main_app/detail_report.html'
    context_object_name = 'report'


class ReportCreateView(AdminRequiredMixin, CreateView):
    model = Report
    form_class = ReportForm
    template_name = 'main_app/add_report.html'
    success_url = reverse_lazy('report_list')

    def form_valid(self, form):
        messages.success(self.request, 'Laporan berhasil ditambahkan.')
        return super().form_valid(form)


class ReportUpdateView(AdminRequiredMixin, UpdateView):
    model = Report
    form_class = ReportForm
    template_name = 'main_app/edit_report.html'
    success_url = reverse_lazy('report_list')

    def form_valid(self, form):
        messages.success(self.request, 'Laporan berhasil diperbarui.')
        return super().form_valid(form)


class ReportDeleteView(AdminRequiredMixin, DeleteView):
    model = Report
    template_name = 'main_app/delete_report.html'
    context_object_name = 'report'
    success_url = reverse_lazy('report_list')

    def form_valid(self, form):
        messages.success(self.request, 'Laporan berhasil dihapus.')
        return super().form_valid(form)


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

        reports = Report.objects.all().order_by('-created_at')

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
        report = get_object_or_404(Report, pk=pk)

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