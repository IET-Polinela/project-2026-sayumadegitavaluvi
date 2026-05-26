from rest_framework import permissions


class IsOwnerAndDraftOrReadOnly(permissions.BasePermission):

    def has_object_permission(self, request, view, obj):

        # GET aman
        if request.method in permissions.SAFE_METHODS:
            return True

        # ADMIN
        if request.user.is_admin:

            # admin hanya boleh update status
            if request.method in ['PUT', 'PATCH']:

                allowed_fields = {'status'}

                request_fields = set(request.data.keys())

                return request_fields.issubset(allowed_fields)

            # admin tidak boleh delete
            return False

        # CITIZEN
        return (
            obj.reporter == request.user
            and obj.status == 'DRAFT'
        )