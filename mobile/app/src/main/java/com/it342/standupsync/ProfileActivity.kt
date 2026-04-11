package com.it342.standupsync

import android.content.Intent
import android.os.Bundle
import android.text.Editable
import android.text.InputType
import android.text.TextWatcher
import android.view.View
import android.widget.*
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.it342.standupsync.api.ApiClient
import com.it342.standupsync.api.AuthApi
import com.it342.standupsync.model.User
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class ProfileActivity : AppCompatActivity() {

    private lateinit var tvUsername: TextView
    private lateinit var tvAvatarLetter: TextView
    private lateinit var tvProfileAvatar: TextView
    private lateinit var tvFeedback: TextView
    private lateinit var etUsername: EditText
    private lateinit var etEmail: EditText
    private lateinit var etCurrentPassword: EditText
    private lateinit var etNewPassword: EditText
    private lateinit var layoutNewPassword: LinearLayout
    private lateinit var btnChangePassword: Button
    private lateinit var btnToggleCurrentPwd: ImageButton
    private lateinit var btnToggleNewPwd: ImageButton
    private lateinit var btnSave: Button
    private lateinit var tvCancel: TextView
    private lateinit var profileArea: LinearLayout
    private var currentPwdVisible = false
    private var newPwdVisible = false

    private var user: User? = null
    private var showingNewPassword = false
    private val specialRegex = Regex("[!@#\$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?]")

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_profile)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        tvUsername = findViewById(R.id.tvUsername)
        tvAvatarLetter = findViewById(R.id.tvAvatarLetter)
        tvProfileAvatar = findViewById(R.id.tvProfileAvatar)
        tvFeedback = findViewById(R.id.tvFeedback)
        etUsername = findViewById(R.id.etUsername)
        etEmail = findViewById(R.id.etEmail)
        etCurrentPassword = findViewById(R.id.etCurrentPassword)
        etNewPassword = findViewById(R.id.etNewPassword)
        layoutNewPassword = findViewById(R.id.layoutNewPassword)
        btnChangePassword = findViewById(R.id.btnChangePassword)
        btnToggleCurrentPwd = findViewById(R.id.btnToggleCurrentPwd)
        btnToggleNewPwd = findViewById(R.id.btnToggleNewPwd)
        btnSave = findViewById(R.id.btnSave)
        tvCancel = findViewById(R.id.tvCancel)
        profileArea = findViewById(R.id.profileArea)

        findViewById<View>(R.id.tvLogo).setOnClickListener { finish() }

        btnSave.isEnabled = false
        btnSave.alpha = 0.4f

        // Eye toggle for current password visibility
        btnToggleCurrentPwd.setOnClickListener {
            currentPwdVisible = !currentPwdVisible
            if (currentPwdVisible) {
                etCurrentPassword.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
                etCurrentPassword.hint = ""
            } else {
                etCurrentPassword.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
                etCurrentPassword.hint = "••••••••••••"
            }
            etCurrentPassword.setSelection(etCurrentPassword.text.length)
        }

        // Eye toggle for new password visibility
        btnToggleNewPwd.setOnClickListener {
            newPwdVisible = !newPwdVisible
            if (newPwdVisible) {
                etNewPassword.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD
                etNewPassword.hint = ""
            } else {
                etNewPassword.inputType = InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD
                etNewPassword.hint = "••••••••••••"
            }
            etNewPassword.setSelection(etNewPassword.text.length)
        }

        btnChangePassword.setOnClickListener { togglePasswordFields() }
        btnSave.setOnClickListener { handleSave() }
        tvCancel.setOnClickListener { finish() }
        profileArea.setOnClickListener { showProfileMenu(it) }

        loadUser()
    }

    private fun loadUser() {
        val api = ApiClient.getRetrofit(this).create(AuthApi::class.java)
        api.getCurrentUser().enqueue(object : Callback<User> {
            override fun onResponse(call: Call<User>, response: Response<User>) {
                if (response.isSuccessful && response.body() != null) {
                    user = response.body()!!
                    tvUsername.text = user!!.username
                    tvAvatarLetter.text = user!!.username.first().uppercaseChar().toString()
                    tvProfileAvatar.text = user!!.username.first().uppercaseChar().toString()
                    etUsername.setText(user!!.username)
                    etEmail.setText(user!!.email)
                    setupChangeWatchers()
                } else {
                    ApiClient.clearAuth(this@ProfileActivity)
                    startActivity(Intent(this@ProfileActivity, MainActivity::class.java))
                    finish()
                }
            }

            override fun onFailure(call: Call<User>, t: Throwable) {
                Toast.makeText(this@ProfileActivity, "Connection error", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun setupChangeWatchers() {
        val watcher = object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}
            override fun afterTextChanged(s: Editable?) { checkForChanges() }
        }
        etUsername.addTextChangedListener(watcher)
        etEmail.addTextChangedListener(watcher)
        etCurrentPassword.addTextChangedListener(watcher)
        etNewPassword.addTextChangedListener(watcher)
    }

    private fun checkForChanges() {
        val usernameChanged = etUsername.text.toString().trim() != (user?.username ?: "")
        val emailChanged = etEmail.text.toString().trim() != (user?.email ?: "")
        val passwordTouched = etCurrentPassword.text.toString().isNotBlank() || etNewPassword.text.toString().isNotBlank()
        val hasChanges = usernameChanged || emailChanged || passwordTouched
        btnSave.isEnabled = hasChanges
        btnSave.alpha = if (hasChanges) 1.0f else 0.4f
    }

    private fun togglePasswordFields() {
        showingNewPassword = !showingNewPassword
        layoutNewPassword.visibility = if (showingNewPassword) View.VISIBLE else View.GONE
        btnChangePassword.text = if (showingNewPassword) "Cancel Password Change" else "Change Password"

        if (!showingNewPassword) {
            etCurrentPassword.setText("")
            etNewPassword.setText("")
        } else {
            etCurrentPassword.requestFocus()
        }
        checkForChanges()
    }

    private fun handleSave() {
        tvFeedback.visibility = View.GONE
        val newUsername = etUsername.text.toString().trim()
        val newEmail = etEmail.text.toString().trim()
        val currentPwd = etCurrentPassword.text.toString()
        val newPwd = etNewPassword.text.toString()

        if (newUsername.isEmpty()) {
            showFeedback("Username is required.", true)
            return
        }

        val usernameChanged = newUsername != (user?.username ?: "")
        val emailChanged = newEmail != (user?.email ?: "")
        val passwordChanged = currentPwd.isNotBlank() || newPwd.isNotBlank()

        if (!usernameChanged && !emailChanged && !passwordChanged) {
            showFeedback("No changes to save.", true)
            return
        }

        if (newPwd.isNotBlank()) {
            if (currentPwd.isBlank()) {
                showFeedback("Please enter your current password to change your password.", true)
                return
            }
            if (newPwd.length < 8) {
                showFeedback("New password must be at least 8 characters long.", true)
                return
            }
            if (!newPwd.any { it.isUpperCase() }) {
                showFeedback("New password must contain at least one uppercase letter.", true)
                return
            }
            if (!newPwd.any { it.isDigit() }) {
                showFeedback("New password must contain at least one number.", true)
                return
            }
            if (!specialRegex.containsMatchIn(newPwd)) {
                showFeedback("New password must contain at least one special character.", true)
                return
            }
        }

        val willLogout = usernameChanged || passwordChanged
        if (willLogout) {
            AlertDialog.Builder(this)
                .setTitle("You will be logged out")
                .setMessage("Changing your username or password requires you to log in again. Do you want to continue?")
                .setPositiveButton("Save & Log Out") { _, _ ->
                    performSave(newUsername, newEmail, currentPwd, newPwd, usernameChanged, passwordChanged, willLogout)
                }
                .setNegativeButton("Cancel", null)
                .show()
        } else {
            performSave(newUsername, newEmail, currentPwd, newPwd, usernameChanged, passwordChanged, willLogout)
        }
    }

    private fun performSave(
        newUsername: String, newEmail: String,
        currentPwd: String, newPwd: String,
        usernameChanged: Boolean, passwordChanged: Boolean,
        willLogout: Boolean
    ) {
        btnSave.isEnabled = false
        btnSave.text = "Saving…"

        val body = mutableMapOf<String, String?>()
        body["username"] = newUsername
        body["email"] = newEmail
        body["currentPassword"] = if (currentPwd.isNotBlank()) currentPwd else null
        body["newPassword"] = if (newPwd.isNotBlank()) newPwd else null

        val api = ApiClient.getRetrofit(this).create(AuthApi::class.java)
        api.updateUser(body).enqueue(object : Callback<User> {
            override fun onResponse(call: Call<User>, response: Response<User>) {
                if (response.isSuccessful && response.body() != null) {
                    if (willLogout) {
                        ApiClient.clearAuth(this@ProfileActivity)
                        Toast.makeText(this@ProfileActivity, "Profile updated. Please log in again.", Toast.LENGTH_LONG).show()
                        startActivity(Intent(this@ProfileActivity, MainActivity::class.java))
                        finishAffinity()
                    } else {
                        user = response.body()!!
                        tvUsername.text = user!!.username
                        tvAvatarLetter.text = user!!.username.first().uppercaseChar().toString()
                        tvProfileAvatar.text = user!!.username.first().uppercaseChar().toString()
                        etCurrentPassword.setText("")
                        etNewPassword.setText("")
                        showingNewPassword = false
                        layoutNewPassword.visibility = View.GONE
                        btnChangePassword.text = "Change Password"
                        showFeedback("Profile updated successfully!", false)
                        resetSaveButton()
                    }
                } else {
                    val errorBody = response.errorBody()?.string()
                    val cleanError = parseErrorMessage(errorBody)
                    showFeedback(cleanError, true)
                    resetSaveButton()
                }
            }

            override fun onFailure(call: Call<User>, t: Throwable) {
                showFeedback("Connection error. Please try again.", true)
                resetSaveButton()
            }
        })
    }

    private fun showFeedback(msg: String, isError: Boolean) {
        tvFeedback.text = msg
        tvFeedback.visibility = View.VISIBLE
        if (isError) {
            tvFeedback.setBackgroundResource(R.drawable.error_background)
            tvFeedback.setTextColor(ContextCompat.getColor(this, R.color.red_accent))
        } else {
            tvFeedback.setBackgroundResource(R.drawable.success_background)
            tvFeedback.setTextColor(ContextCompat.getColor(this, R.color.green_accent))
        }
    }

    private fun resetSaveButton() {
        btnSave.text = "Save Changes"
        checkForChanges()
    }

    private fun parseErrorMessage(raw: String?): String {
        if (raw.isNullOrBlank()) return "Failed to save changes."
        val regex = Regex("""["']?error["']?\s*[:=]\s*["']?([^"'{}]+)["']?""")
        val match = regex.find(raw)
        return match?.groupValues?.get(1)?.trim() ?: raw.trim().removeSurrounding("{", "}").trim()
    }

    private fun showProfileMenu(anchor: View) {
        val popup = PopupMenu(this, anchor)
        popup.menu.add("Profile Settings")
        popup.menu.add("Logout")
        popup.setOnMenuItemClickListener { item ->
            when (item.title) {
                "Logout" -> {
                    ApiClient.clearAuth(this)
                    startActivity(Intent(this, MainActivity::class.java))
                    finishAffinity()
                    true
                }
                else -> true
            }
        }
        popup.show()
    }
}
