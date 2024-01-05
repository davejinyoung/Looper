from django.db import models


# Create your models here.
class EmailAddress(models.Model):
    addr = models.CharField(max_length=200)

    def __str__(self):
        return self.addr


class Password(models.Model):
    password = models.CharField(max_length=1000)

    def __str__(self):
        return self.password
