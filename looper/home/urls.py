from django.urls import path

from . import views

urlpatterns = [
    path("home/", views.home, name="home"),
    path("saved-routes/", views.saved_routes, name="saved_routes"),
]
