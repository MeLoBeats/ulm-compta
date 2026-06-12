<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Label extends Model
{
    protected $fillable = [
        'name',
        'description',
        'director_employee_id',
        'logo_path',
        'founded_at',
    ];

    protected function casts(): array
    {
        return [
            'founded_at' => 'date',
        ];
    }

    public function director(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'director_employee_id');
    }

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class);
    }

    public function artists(): HasMany
    {
        return $this->hasMany(Artist::class);
    }

    public function releases(): HasMany
    {
        return $this->hasMany(Release::class);
    }
}
