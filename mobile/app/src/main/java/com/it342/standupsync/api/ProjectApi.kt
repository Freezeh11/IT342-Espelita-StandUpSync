package com.it342.standupsync.api

import com.it342.standupsync.model.Project
import retrofit2.Call
import retrofit2.http.*

interface ProjectApi {

    @GET("api/projects")
    fun getProjects(): Call<List<Project>>

    @POST("api/projects")
    fun createProject(@Body project: Project): Call<Project>

    @PUT("api/projects/{id}")
    fun updateProject(@Path("id") id: Long, @Body project: Project): Call<Project>

    @DELETE("api/projects/{id}")
    fun deleteProject(@Path("id") id: Long): Call<Void>
}
