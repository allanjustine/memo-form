<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable,HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'firstName',
        'lastName',
        'userName',
        'contact',
        'branch_code',
        'branch',
        'userName',
        'employee_id',
        'email',
        'password',
        'position',
        'signature',
        'role',
        'profile_picture',
       
    ];


    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }


    public function branch()
    {
        return $this->belongsTo(Branch::class, 'branch_code');
    }    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function memo()
    {
        return $this->hasMany(Memo::class);
        
    }
    public function explain()
    {
        return $this->hasMany(Explain::class);

    }




}
