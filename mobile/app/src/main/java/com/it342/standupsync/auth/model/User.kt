package com.it342.standupsync.auth.model

data class User(
    val id: Long? = null,
    val username: String = "",
    val email: String = "",
    val password: String? = null,
    val role: String? = null
)
