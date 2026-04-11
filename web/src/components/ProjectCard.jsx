import '../css/project-card.css';

export const ProjectCard = ({ project, onClick }) => {
    const stats = project.stats || { inProgress: 0, blocker: 0, done: 0 };
    return (
        <article className="project-card" onClick={onClick}>
            <header className="project-card__title">
                {project.name}
            </header>
            <div className="project-card__stats">
                {[['inProgress', 'IN PROGRESS'], ['blocker', 'BLOCKER'], ['done', 'DONE']].map(([key, label]) => (
                    <div key={key} className="project-card__stat-row">
                        <span className={`project-card__stat-label project-card__color--${key}`}>{label}</span>
                        <span className={`project-card__stat-value project-card__color--${key}`}>{stats[key]}</span>
                    </div>
                ))}
            </div>
        </article>
    );
};
