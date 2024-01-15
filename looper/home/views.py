from django.shortcuts import render
from django.contrib.auth.decorators import login_required


# Create your views here.

@login_required(login_url="/login")
def home(response):
    return render(response, 'home/home.html')


@login_required(login_url="/login")
def saved_routes(response):
    return render(response, 'home/saved_routes.html')
