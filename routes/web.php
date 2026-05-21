<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard/Index');
})->name('dashboard');

Route::get('/profile', function () {
    return Inertia::render('Profile/Index');
})->name('profile');

Route::get('/reservation', function () {
    return Inertia::render('Reservation/Index');
})->name('reservation');

Route::get('/frontoffice', function () {
    return Inertia::render('FrontOffice/Index');
})->name('frontoffice');

Route::get('/archived', function () {
    return Inertia::render('Archived/Index');
})->name('archived');

Route::get('/room', function () {
    return Inertia::render('Room/Index');
})->name('room');

Route::get('/settings', function () {
    return Inertia::render('Settings/Index');
})->name('settings');

require __DIR__.'/auth.php';
