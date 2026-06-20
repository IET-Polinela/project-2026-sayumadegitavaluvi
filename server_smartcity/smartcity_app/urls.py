"""
URL configuration for smartcity_app project.
"""

from django.contrib import admin
from django.urls import path, include

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from usermanagement_24782030.api_views import RegisterView

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django_scalar.views import scalar_viewer


urlpatterns = [
    path('admin/', admin.site.urls),

    # Template pages
    path('', include('main_app.urls')),
    path('', include('dashboard_24782030.urls')),
    path('', include('about.urls')),
    path('', include('contacts.urls')),
    path('', include('usermanagement_24782030.urls')),

    # Authentication API
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='api_register'),

    # Report API
    path('api/', include('main_app.api_urls')),

    # OpenAPI schema
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),

    # Swagger UI
    path(
        'api/docs/swagger/',
        SpectacularSwaggerView.as_view(url_name='schema'),
        name='swagger-ui'
    ),

    # Scalar UI
    path('api/docs/scalar/', scalar_viewer, name='scalar-ui'),
]