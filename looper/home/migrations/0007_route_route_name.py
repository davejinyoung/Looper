# Generated by Django 4.2.9 on 2024-06-25 04:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("home", "0006_alter_route_user"),
    ]

    operations = [
        migrations.AddField(
            model_name="route",
            name="route_name",
            field=models.CharField(default="Route", max_length=255),
        ),
    ]
