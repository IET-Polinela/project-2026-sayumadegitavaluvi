from django.views.generic import TemplateView, View
from django.http import JsonResponse
from django.db.models import Count
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin

from main_app.models import Report


class AdminRequiredMixin(LoginRequiredMixin, UserPassesTestMixin):
    login_url = 'login'

    def test_func(self):
        return self.request.user.is_authenticated and self.request.user.is_admin


class DashboardView(AdminRequiredMixin, TemplateView):
    template_name = 'dashboard_24782030/dashboard.html'


class DashboardDataView(AdminRequiredMixin, View):
    def get(self, request, *args, **kwargs):
        total_reports = Report.objects.count()

        status_raw = Report.objects.values('status').annotate(
            total=Count('id')
        ).order_by('status')

        status_distribution = []

        for item in status_raw:
            percentage = round((item['total'] / total_reports) * 100, 2) if total_reports > 0 else 0
            status_distribution.append({
                'status': item['status'],
                'total': item['total'],
                'percentage': percentage,
            })

        category_raw = Report.objects.values('category').annotate(
            total=Count('id')
        ).order_by('-total')

        category_distribution = list(category_raw)

        latest_reported = [
            {
                'id': report.id,
                'title': report.title,
                'category': report.category,
                'location': report.location,
                'status': report.status,
                'created_at': report.created_at.strftime('%d-%m-%Y %H:%M'),
            }
            for report in Report.objects.filter(status='REPORTED').order_by('-created_at')[:5]
        ]

        latest_resolved = [
            {
                'id': report.id,
                'title': report.title,
                'category': report.category,
                'location': report.location,
                'status': report.status,
                'created_at': report.created_at.strftime('%d-%m-%Y %H:%M'),
            }
            for report in Report.objects.filter(status='RESOLVED').order_by('-created_at')[:5]
        ]

        data = {
            'total_reports': total_reports,
            'status_distribution': status_distribution,
            'category_distribution': category_distribution,
            'latest_reported': latest_reported,
            'latest_resolved': latest_resolved,
        }

        return JsonResponse(data)