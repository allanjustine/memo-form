<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Explain extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'memo_id',
        'date',
        'header_name',
        'explain_body',
        'noted_by',
        'createdMemo',
        'status'
    ];
    protected $casts = [
        'header_name' => 'array', // Automatically cast to array
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approvalProcess()
    {
        return $this->hasMany(ExplainApprovalProcess::class);
    }
}