package com.it342.standupsync.model

data class Task(
    val id: Long? = null,
    val projectId: Long? = null,
    val title: String = "",
    val description: String? = null,
    val status: String = "inProgress",
    val isBlocked: Boolean = false,
    val blockerReason: String? = null,
    val updatedAt: String? = null
)
