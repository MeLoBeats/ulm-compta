<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('graphic_works', function (Blueprint $table) {
            $table->id();
            $table->date('week_start');
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->string('work_type', 10); // cover | affiche
            $table->unsignedInteger('quantity')->default(1);
            $table->text('notes')->nullable();
            $table->foreignId('recorded_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('graphic_works');
    }
};
