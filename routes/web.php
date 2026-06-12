<?php

use App\Http\Controllers\ArtistController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\LabelController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\ReleaseController;
use App\Http\Controllers\SaleController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::resource('positions', PositionController::class)->except('show');
    Route::resource('employees', EmployeeController::class)->except('show');
    Route::resource('labels', LabelController::class);
    Route::resource('artists', ArtistController::class);
    Route::resource('releases', ReleaseController::class);

    Route::post('releases/{release}/sales', [SaleController::class, 'store'])->name('releases.sales.store');
    Route::delete('releases/{release}/sales/{sale}', [SaleController::class, 'destroy'])->name('releases.sales.destroy');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
