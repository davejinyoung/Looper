from django.http import HttpResponse
from django.template import Template, Context
from django.template.loader import get_template
from django.shortcuts import render


def signup(response):
    return render(response, 'registration/signup.html')

