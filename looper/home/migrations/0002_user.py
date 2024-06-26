# Generated by Django 4.2.9 on 2024-06-01 21:26

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("home", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="User",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("username", models.CharField(max_length=255)),
                ("password", models.CharField(max_length=255)),
                ("email", models.CharField(max_length=255)),
                ("first_name", models.CharField(max_length=255)),
                ("last_name", models.CharField(max_length=255)),
                ("friends", models.ManyToManyField(to="home.user")),
                ("routes", models.ManyToManyField(to="home.route")),
            ],
        ),
    ]
