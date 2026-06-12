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
        Schema::create('releases', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('type')->default('Single');
            $table->date('release_date');
            $table->foreignId('label_id')->nullable()->constrained()->nullOnDelete();
            $table->string('streaming_url')->nullable();
            $table->string('cover_path')->nullable();
            $table->string('genre')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('releases');
    }
};
