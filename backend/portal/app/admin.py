from django.contrib import admin

from .models import AuditLog, Notification, Profile, UserPreferences

admin.site.site_header = "portal"
admin.site.site_title = "portal"
admin.site.index_title = "Administration"

admin.site.register(Profile)
admin.site.register(UserPreferences)
admin.site.register(Notification)
admin.site.register(AuditLog)