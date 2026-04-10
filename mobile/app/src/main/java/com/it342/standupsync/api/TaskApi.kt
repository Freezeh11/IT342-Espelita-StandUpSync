package com.it342.standupsync.api

import com.it342.standupsync.model.Task
import retrofit2.Call
import retrofit2.http.*

interface TaskApi {

    @GET("api/tasks")
    fun getTasks(@Query("projectId") projectId: Long? = null): Call<List<Task>>

    @POST("api/tasks")
    fun createTask(@Body task: Task): Call<Task>

    @PUT("api/tasks/{id}")
    fun updateTask(@Path("id") id: Long, @Body task: Task): Call<Task>

    @DELETE("api/tasks/{id}")
    fun deleteTask(@Path("id") id: Long): Call<Void>
}
