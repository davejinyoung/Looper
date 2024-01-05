from django.contrib import admin
from .models import EmailAddress, Password

# Register your models here.
admin.site.register(EmailAddress)
admin.site.register(Password)
