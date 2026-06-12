<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('contractor_release', function (Blueprint $table) {
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('release_id')->constrained()->cascadeOnDelete();
            $table->primary(['employee_id', 'release_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contractor_release');
    }
};
