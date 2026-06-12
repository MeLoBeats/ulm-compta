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
        Schema::table('positions', function (Blueprint $table) {
            $table->boolean('is_contractor')->default(false)->after('is_open');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->decimal('fee_per_release', 10, 2)->nullable()->after('weekly_salary');
        });
    }

    public function down(): void
    {
        Schema::table('positions', function (Blueprint $table) {
            $table->dropColumn('is_contractor');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('fee_per_release');
        });
    }
};
