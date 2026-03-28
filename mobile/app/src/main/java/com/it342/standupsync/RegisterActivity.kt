package com.it342.standupsync

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
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

class RegisterActivity : AppCompatActivity() {

    private lateinit var etUsername: EditText
    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var etConfirmPassword: EditText
    private lateinit var tvError: TextView
    private lateinit var tvSuccess: TextView
    private lateinit var btnRegister: Button
    private lateinit var tvLoginLink: TextView

    private val emailRegex = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")
    private val specialRegex = Regex("[!@#\$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_register)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        etUsername = findViewById(R.id.etUsername)
        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        etConfirmPassword = findViewById(R.id.etConfirmPassword)
        tvError = findViewById(R.id.tvError)
        tvSuccess = findViewById(R.id.tvSuccess)
        btnRegister = findViewById(R.id.btnRegister)
        tvLoginLink = findViewById(R.id.tvLoginLink)

        btnRegister.setOnClickListener { handleRegister() }
        tvLoginLink.setOnClickListener {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
        }
    }

    private fun handleRegister() {
        tvError.visibility = View.GONE
        tvSuccess.visibility = View.GONE

        val username = etUsername.text.toString().trim()
        val email = etEmail.text.toString().trim()
        val password = etPassword.text.toString()
        val confirm = etConfirmPassword.text.toString()

        val error = validateForm(username, email, password, confirm)
        if (error != null) {
            showError(error)
            return
        }

        btnRegister.isEnabled = false
        btnRegister.text = "Creating account..."

        val api = ApiClient.getRetrofit(this).create(AuthApi::class.java)
        val user = User(username = username, email = email, password = password)

        api.register(user).enqueue(object : Callback<User> {
            override fun onResponse(call: Call<User>, response: Response<User>) {
                if (response.isSuccessful) {
                    tvSuccess.text = "Account created! Redirecting to login..."
                    tvSuccess.visibility = View.VISIBLE
                    Handler(Looper.getMainLooper()).postDelayed({
                        startActivity(Intent(this@RegisterActivity, MainActivity::class.java))
                        finish()
                    }, 1800)
                } else {
                    val code = response.code()
                    if (code == 400 || code == 409) {
                        val body = response.errorBody()?.string()
                        showError(
                            if (!body.isNullOrBlank()) body
                            else "An account with this username or email already exists."
                        )
                    } else {
                        showError("Registration failed. Please try again later.")
                    }
                    resetButton()
                }
            }

            override fun onFailure(call: Call<User>, t: Throwable) {
                showError("Cannot reach the server. Please check your connection.")
                resetButton()
            }
        })
    }

    private fun validateForm(username: String, email: String, password: String, confirm: String): String? {
        if (username.isEmpty()) return "Username is required."
        if (username.length < 3) return "Username must be at least 3 characters."
        if (email.isEmpty()) return "Email is required."
        if (!emailRegex.matches(email)) return "Please enter a valid email address."
        if (password.isEmpty()) return "Password is required."
        if (password.length < 8) return "Password must be at least 8 characters long."
        if (!password.any { it.isUpperCase() }) return "Password must contain at least one uppercase letter."
        if (!password.any { it.isDigit() }) return "Password must contain at least one number."
        if (!specialRegex.containsMatchIn(password)) return "Password must contain at least one special character."
        if (confirm.isEmpty()) return "Please confirm your password."
        if (confirm != password) return "Passwords do not match."
        return null
    }

    private fun showError(msg: String) {
        tvError.text = msg
        tvError.visibility = View.VISIBLE
    }

    private fun resetButton() {
        btnRegister.isEnabled = true
        btnRegister.text = "Create Account"
    }
}
