from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from sign_in_out.models import UserProfile

class RegisterForm(UserCreationForm):
    address = forms.CharField(max_length=255, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2', 'address']

    def save(self, commit=True):
        user = super().save(commit=False)
        if commit:
            user.save()
            user_profile, created =  UserProfile.objects.update_or_create(user=user, defaults={'address': self.cleaned_data['address']})
            return user_profile
        return user

class UserProfileForm(forms.ModelForm):
    class Meta:
        model = UserProfile
        fields = ['address']

class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ['username', 'email']