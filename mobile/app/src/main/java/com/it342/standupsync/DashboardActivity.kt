package com.it342.standupsync

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.LinearLayout
import android.widget.PopupMenu
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.it342.standupsync.adapter.ProjectAdapter
import com.it342.standupsync.adapter.ProjectWithStats
import com.it342.standupsync.api.ApiClient
import com.it342.standupsync.api.AuthApi
import com.it342.standupsync.api.ProjectApi
import com.it342.standupsync.api.TaskApi
import com.it342.standupsync.model.Project
import com.it342.standupsync.model.Task
import com.it342.standupsync.model.User
import android.widget.EditText
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class DashboardActivity : AppCompatActivity() {

    private lateinit var tvUsername: TextView
    private lateinit var tvAvatarLetter: TextView
    private lateinit var tvEmptyState: TextView
    private lateinit var rvProjects: RecyclerView
    private lateinit var profileArea: LinearLayout
    private lateinit var btnAddProject: LinearLayout

    private lateinit var projectAdapter: ProjectAdapter
    private var allTasks: List<Task> = emptyList()
    private var projects: MutableList<Project> = mutableListOf()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_dashboard)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        // Check auth
        if (ApiClient.getAuth(this) == null) {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            return
        }

        tvUsername = findViewById(R.id.tvUsername)
        tvAvatarLetter = findViewById(R.id.tvAvatarLetter)
        tvEmptyState = findViewById(R.id.tvEmptyState)
        rvProjects = findViewById(R.id.rvProjects)
        profileArea = findViewById(R.id.profileArea)
        btnAddProject = findViewById(R.id.btnAddProject)

        projectAdapter = ProjectAdapter { project ->
            val intent = Intent(this, ProjectActivity::class.java)
            intent.putExtra("projectName", project.name)
            intent.putExtra("projectId", project.id)
            startActivity(intent)
        }

        rvProjects.layoutManager = LinearLayoutManager(this)
        rvProjects.adapter = projectAdapter

        profileArea.setOnClickListener { showProfileMenu(it) }
        btnAddProject.setOnClickListener { showCreateProjectDialog() }

        loadData()
    }

    override fun onResume() {
        super.onResume()
        if (ApiClient.getAuth(this) != null) {
            loadData()
        }
    }

    private fun loadData() {
        val retrofit = ApiClient.getRetrofit(this)
        val authApi = retrofit.create(AuthApi::class.java)

        authApi.getCurrentUser().enqueue(object : Callback<User> {
            override fun onResponse(call: Call<User>, response: Response<User>) {
                if (response.isSuccessful && response.body() != null) {
                    val user = response.body()!!
                    tvUsername.text = user.username
                    tvAvatarLetter.text = user.username.first().uppercaseChar().toString()
                    loadProjects()
                    loadAllTasks()
                } else {
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

    private fun loadProjects() {
        val api = ApiClient.getRetrofit(this).create(ProjectApi::class.java)
        api.getProjects().enqueue(object : Callback<List<Project>> {
            override fun onResponse(call: Call<List<Project>>, response: Response<List<Project>>) {
                if (response.isSuccessful) {
                    projects = (response.body() ?: emptyList()).toMutableList()
                    updateProjectList()
                }
            }

            override fun onFailure(call: Call<List<Project>>, t: Throwable) {
                Toast.makeText(this@DashboardActivity, "Could not load projects", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun loadAllTasks() {
        val api = ApiClient.getRetrofit(this).create(TaskApi::class.java)
        api.getTasks(null).enqueue(object : Callback<List<Task>> {
            override fun onResponse(call: Call<List<Task>>, response: Response<List<Task>>) {
                if (response.isSuccessful) {
                    allTasks = response.body() ?: emptyList()
                    updateProjectList()
                }
            }

            override fun onFailure(call: Call<List<Task>>, t: Throwable) {}
        })
    }

    private fun updateProjectList() {
        if (projects.isEmpty()) {
            tvEmptyState.visibility = View.VISIBLE
            rvProjects.visibility = View.GONE
        } else {
            tvEmptyState.visibility = View.GONE
            rvProjects.visibility = View.VISIBLE
        }

        val taskStats = mutableMapOf<Long, Triple<Int, Int, Int>>()
        allTasks.forEach { task ->
            val pid = task.projectId ?: return@forEach
            val current = taskStats.getOrDefault(pid, Triple(0, 0, 0))
            taskStats[pid] = when (task.status) {
                "inProgress" -> Triple(current.first + 1, current.second, current.third)
                "blocker" -> Triple(current.first, current.second + 1, current.third)
                "done" -> Triple(current.first, current.second, current.third + 1)
                else -> current
            }
        }

        val items = projects.map { p ->
            val stats = taskStats[p.id] ?: Triple(0, 0, 0)
            ProjectWithStats(p, stats.first, stats.second, stats.third)
        }
        projectAdapter.setData(items)
    }

    private fun showCreateProjectDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_create_project, null)
        val dialog = AlertDialog.Builder(this, R.style.Theme_StandupSync)
            .setView(dialogView)
            .create()

        dialog.window?.setBackgroundDrawableResource(android.R.color.transparent)

        val etProjectName = dialogView.findViewById<EditText>(R.id.etProjectName)
        dialogView.findViewById<View>(R.id.btnCreate).setOnClickListener {
            val name = etProjectName.text.toString().trim()
            if (name.isEmpty()) {
                Toast.makeText(this, "Please enter a project name", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            createProject(name)
            dialog.dismiss()
        }
        dialogView.findViewById<View>(R.id.btnCancel).setOnClickListener { dialog.dismiss() }

        dialog.show()
        dialog.window?.let { w ->
            val lp = w.attributes
            lp.gravity = android.view.Gravity.CENTER
            w.attributes = lp
        }
    }

    private fun createProject(name: String) {
        val api = ApiClient.getRetrofit(this).create(ProjectApi::class.java)
        api.createProject(Project(name = name)).enqueue(object : Callback<Project> {
            override fun onResponse(call: Call<Project>, response: Response<Project>) {
                if (response.isSuccessful && response.body() != null) {
                    projects.add(response.body()!!)
                    updateProjectList()
                } else {
                    Toast.makeText(this@DashboardActivity, "Failed to create project", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<Project>, t: Throwable) {
                Toast.makeText(this@DashboardActivity, "Connection error", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun showProfileMenu(anchor: View) {
        val popup = PopupMenu(this, anchor)
        popup.menu.add("Profile Settings")
        popup.menu.add("Logout")
        popup.setOnMenuItemClickListener { item ->
            when (item.title) {
                "Profile Settings" -> {
                    startActivity(Intent(this, ProfileActivity::class.java))
                    true
                }
                "Logout" -> {
                    ApiClient.clearAuth(this)
                    startActivity(Intent(this, MainActivity::class.java))
                    finishAffinity()
                    true
                }
                else -> false
            }
        }
        popup.show()
    }
}