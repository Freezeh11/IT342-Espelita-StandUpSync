package com.it342.standupsync

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.it342.standupsync.api.ApiClient
import com.it342.standupsync.api.AuthApi
import com.it342.standupsync.model.User
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class DashboardActivity : AppCompatActivity() {

    private lateinit var tvUsername: TextView
    private lateinit var tvAvatarLetter: TextView
    private lateinit var tvAvatarSmall: TextView
    private lateinit var tvWelcome: TextView
    private lateinit var tvEmail: TextView
    private lateinit var btnLogout: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_dashboard)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        // Guard: redirect to login if not authenticated
        if (ApiClient.getAuth(this) == null) {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            return
        }

        tvUsername     = findViewById(R.id.tvUsername)
        tvAvatarLetter = findViewById(R.id.tvAvatarLetter)
        tvAvatarSmall  = findViewById(R.id.tvAvatarSmall)
        tvWelcome      = findViewById(R.id.tvWelcome)
        tvEmail        = findViewById(R.id.tvEmail)
        btnLogout      = findViewById(R.id.btnLogout)

        btnLogout.setOnClickListener {
            ApiClient.clearAuth(this)
            startActivity(Intent(this, MainActivity::class.java))
            finishAffinity()
        }

        loadCurrentUser()
    }

    override fun onResume() {
        super.onResume()
        if (ApiClient.getAuth(this) != null) {
            loadCurrentUser()
        }
    }

    private fun loadCurrentUser() {
        val api = ApiClient.getRetrofit(this).create(AuthApi::class.java)
        api.getCurrentUser().enqueue(object : Callback<User> {
            override fun onResponse(call: Call<User>, response: Response<User>) {
                if (response.isSuccessful && response.body() != null) {
                    val user = response.body()!!
                    val initial = user.username.first().uppercaseChar().toString()
                    tvUsername.text = user.username
                    tvAvatarLetter.text = initial
                    tvAvatarSmall.text  = initial
                    tvWelcome.text = "Welcome back, ${user.username}!"
                    tvEmail.text = user.email
                } else {
                    // Session expired
                    ApiClient.clearAuth(this@DashboardActivity)
                    startActivity(Intent(this@DashboardActivity, MainActivity::class.java))
                    finish()
                }
            }

            override fun onFailure(call: Call<User>, t: Throwable) {
                Toast.makeText(this@DashboardActivity, "Connection error", Toast.LENGTH_SHORT).show()
            }
        })
    }
}