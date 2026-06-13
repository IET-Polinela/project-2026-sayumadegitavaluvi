from django.urls import path
from .views import (
    HomePageView,
    ReportListView,
    ReportDetailView,
    ReportCreateView,
    ReportUpdateView,
    ReportDeleteView,
    ReportUpdateStatusView,
    ReportSearchView,
    ReportDetailJsonView,
)

urlpatterns = [
    path('', HomePageView.as_view(), name='home'),
    path('reports/', ReportListView.as_view(), name='report_list'),
    path('reports/search/', ReportSearchView.as_view(), name='report_search'),
    path('reports/detail/<int:pk>/', ReportDetailView.as_view(), name='detail_report'),
    path('reports/detail-json/<int:pk>/', ReportDetailJsonView.as_view(), name='detail_report_json'),
    path('reports/add/', ReportCreateView.as_view(), name='add_report'),
    path('reports/edit/<int:pk>/', ReportUpdateView.as_view(), name='edit_report'),
    path('reports/delete/<int:pk>/', ReportDeleteView.as_view(), name='delete_report'),
    path('reports/update-status/<int:pk>/', ReportUpdateStatusView.as_view(), name='update_status'),
]