import { useState } from 'react';
import '../css/create-project-modal.css';

export const CreateProjectModal = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');

    const handleCreate = () => {
        if (!name.trim()) return;
        onCreate(name.trim());
        onClose();
    };

    return (
        <div className="cpm__overlay" onClick={onClose}>
            <div className="cpm__card" onClick={e => e.stopPropagation()}>
                <h2 className="cpm__title">Create <span className="cpm__title-highlight">Project</span></h2>
                <label className="cpm__label">Project Name</label>
                <input
                    className="cpm__input"
                    type="text"
                    placeholder="Input Project Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    autoFocus
                />
                <button className="cpm__btn-primary" onClick={handleCreate}>Create Project</button>
                <button className="cpm__btn-secondary" onClick={onClose}>Cancel</button>
            </div>
        </div>
    );
};
