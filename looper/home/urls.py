from django.urls import path

from . import views

urlpatterns = [
    path("home/", views.home, name="home"),
    path("saved-routes/", views.saved_routes, name="saved_routes"),
    path("save_route/", views.save_route, name="save_route"),
    path("delete_route/", views.delete_route, name="delete_route"),
    path('profile/settings/', views.profile_settings, name='profile_settings')
]
