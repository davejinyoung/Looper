from django.http import HttpResponse
from django.template import Template, Context
from django.template.loader import get_template
from django.shortcuts import render


def signup(request):
    return render(request, 'signup.html')


def login(request):
    return render(request, 'login.html')
