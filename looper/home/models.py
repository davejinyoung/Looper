from django.db import models

# Create your models here.
class Route(models.Model):
    start_point = models.CharField(max_length=255)
    end_point = models.CharField(max_length=255)
    total_distance = models.FloatField()
    total_time = models.FloatField()
