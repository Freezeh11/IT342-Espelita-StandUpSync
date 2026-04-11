package com.it342.standupsync.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.it342.standupsync.R
import com.it342.standupsync.model.Project

data class ProjectWithStats(
    val project: Project,
    val inProgress: Int = 0,
    val blocker: Int = 0,
    val done: Int = 0
)

class ProjectAdapter(
    private val items: MutableList<ProjectWithStats> = mutableListOf(),
    private val onClick: (Project) -> Unit
) : RecyclerView.Adapter<ProjectAdapter.ViewHolder>() {

    inner class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvProjectName: TextView = view.findViewById(R.id.tvProjectName)
        val tvInProgress: TextView = view.findViewById(R.id.tvInProgress)
        val tvBlocker: TextView = view.findViewById(R.id.tvBlocker)
        val tvDone: TextView = view.findViewById(R.id.tvDone)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_project_card, parent, false)
        return ViewHolder(view)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = items[position]
        holder.tvProjectName.text = item.project.name
        holder.tvInProgress.text = item.inProgress.toString()
        holder.tvBlocker.text = item.blocker.toString()
        holder.tvDone.text = item.done.toString()
        holder.itemView.setOnClickListener { onClick(item.project) }
    }

    override fun getItemCount(): Int = items.size

    fun setData(data: List<ProjectWithStats>) {
        items.clear()
        items.addAll(data)
        notifyDataSetChanged()
    }

    fun addItem(item: ProjectWithStats) {
        items.add(item)
        notifyItemInserted(items.size - 1)
    }
}
