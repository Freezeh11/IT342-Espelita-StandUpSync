package com.it342.standupsync.model

data class User(
    val id: Long? = null,
    val username: String = "",
    val email: String = "",
    val password: String? = null,
    val role: String? = null
)
