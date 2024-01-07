from django.http import HttpResponse
from django.template import Template, Context
from django.template.loader import get_template
from django.contrib.auth import login
from django.shortcuts import render, redirect
from .forms import RegisterForm


def signup(request):
    if request.user.is_authenticated:
        return redirect('/home')
    elif request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('/home')
    else:
        form = RegisterForm()
    return render(request, 'registration/signup.html', {"form": form})

