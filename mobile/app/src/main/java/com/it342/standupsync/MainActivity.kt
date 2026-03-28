package com.it342.standupsync

import android.content.Intent
import android.os.Bundle
import android.util.Base64
import android.view.View
import android.widget.Button
import android.widget.EditText
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

class MainActivity : AppCompatActivity() {

    private lateinit var etUsername: EditText
    private lateinit var etPassword: EditText
    private lateinit var tvError: TextView
    private lateinit var btnLogin: Button
    private lateinit var tvRegisterLink: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (ApiClient.getAuth(this) != null) {
            startActivity(Intent(this, DashboardActivity::class.java))
            finish()
            return
        }

        enableEdgeToEdge()
        setContentView(R.layout.activity_main)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        etUsername = findViewById(R.id.etUsername)
        etPassword = findViewById(R.id.etPassword)
        tvError = findViewById(R.id.tvError)
        btnLogin = findViewById(R.id.btnLogin)
        tvRegisterLink = findViewById(R.id.tvRegisterLink)

        btnLogin.setOnClickListener { handleLogin() }
        tvRegisterLink.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }
    }

    private fun handleLogin() {
        tvError.visibility = View.GONE
        val username = etUsername.text.toString().trim()
        val password = etPassword.text.toString()

        if (username.isEmpty()) {
            showError("Username is required.")
            return
        }
        if (password.isEmpty()) {
            showError("Password is required.")
            return
        }

        btnLogin.isEnabled = false
        btnLogin.text = "Signing in..."

        val credentials = "$username:$password"
        val authHeader = "Basic " + Base64.encodeToString(credentials.toByteArray(), Base64.NO_WRAP)
        ApiClient.saveAuth(this, authHeader)

        val api = ApiClient.getRetrofit(this).create(AuthApi::class.java)
        api.getCurrentUser().enqueue(object : Callback<User> {
            override fun onResponse(call: Call<User>, response: Response<User>) {
                if (response.isSuccessful && response.body() != null) {
                    ApiClient.saveUsername(this@MainActivity, username)
                    Toast.makeText(this@MainActivity, "Login successful.", Toast.LENGTH_SHORT).show()
                    startActivity(Intent(this@MainActivity, DashboardActivity::class.java))
                    finish()
                } else {
                    ApiClient.clearAuth(this@MainActivity)
                    val code = response.code()
                    if (code == 401 || code == 403) {
                        showError("Incorrect username or password. Please try again.")
                    } else {
                        showError("Something went wrong. Please try again later.")
                    }
                    resetButton()
                }
            }

            override fun onFailure(call: Call<User>, t: Throwable) {
                ApiClient.clearAuth(this@MainActivity)
                showError("Cannot reach the server. Please check your connection.")
                resetButton()
            }
        })
    }

    private fun showError(msg: String) {
        tvError.text = msg
        tvError.visibility = View.VISIBLE
    }

    private fun resetButton() {
        btnLogin.isEnabled = true
        btnLogin.text = "Login"
    }
}
