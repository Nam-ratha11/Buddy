"use client";

export default function Tabs({ tabs, activeTab, onTabChange }) {
    return (
        <nav className="tabs-container">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const isDisabled = tab.disabled;

                return (
                    <button
                        key={tab.id}
                        onClick={() => !isDisabled && onTabChange(tab.id)}
                        disabled={isDisabled}
                        className={`tab-item ${isActive ? 'active' : ''}`}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </nav>
    );
}
