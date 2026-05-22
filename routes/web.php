<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return Inertia::render('Welcome');
});

/* =========================================================
   DASHBOARD
========================================================= */
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard/Index');
})->name('dashboard');

/* =========================================================
   PROFILE
========================================================= */
Route::get('/profile', function () {
    return Inertia::render('Profile/Index');
})->name('profile');

/* =========================================================
   RESERVATION
========================================================= */
Route::get('/reservation', function () {
    return Inertia::render('Reservation/Index');
})->name('reservation');

/* =========================================================
   FRONT OFFICE
========================================================= */
Route::get('/frontoffice', function () {
    return Inertia::render('FrontOffice/Index');
})->name('frontoffice');

/* =========================================================
   ARCHIVED
========================================================= */
Route::get('/archived', function () {
    return Inertia::render('Archived/Index');
})->name('archived');

/* =========================================================
   ROOM MANAGEMENT
========================================================= */
Route::get('/room', function () {
    return Inertia::render('Room/Index');
})->name('room');

/* =========================================================
   AUDIT & REPORTS
========================================================= */
Route::get('/audit', function () {
    return Inertia::render('Audit/Index');
})->name('audit');

/* =========================================================
   SETTINGS
========================================================= */
Route::get('/settings', function () {
    return Inertia::render('Settings/Index');
})->name('settings');

/* =========================================================
   AUTH ROUTES
========================================================= */
require __DIR__ . '/auth.php';