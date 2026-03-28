package com.it342.standupsync.api

import com.it342.standupsync.model.User
import retrofit2.Call
import retrofit2.http.*

interface AuthApi {

    @POST("api/auth/register")
    fun register(@Body user: User): Call<User>

    @POST("api/auth/login")
    fun login(@Body user: User): Call<String>

    @GET("api/user/me")
    fun getCurrentUser(): Call<User>

    @PUT("api/user/me")
    fun updateUser(@Body body: Map<String, String?>): Call<User>
}
