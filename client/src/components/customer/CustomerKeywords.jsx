/**
 * Customer Keywords Component
 * 
 * Displays and allows adding keywords (Human-in-the-Loop).
 */

import { useState } from 'react';
import { formatDate } from '../../utils';

function CustomerKeywords({ keywords = [], keywordGroups = {}, onAdd }) {
    const [showPicker, setShowPicker] = useState(false);
    const [selectedKeywords, setSelectedKeywords] = useState([]);
    const [activeCategory, setActiveCategory] = useState(null);

    const existingKeywords = keywords.map(k => k.keyword.toLowerCase());

    const handleToggleKeyword = (keyword) => {
        setSelectedKeywords(prev =>
            prev.includes(keyword)
                ? prev.filter(k => k !== keyword)
                : [...prev, keyword]
        );
    };

    const handleSubmit = () => {
        if (selectedKeywords.length > 0) {
            onAdd(selectedKeywords);
            setSelectedKeywords([]);
            setShowPicker(false);
        }
    };

    const categories = Object.keys(keywordGroups);

    return (
        <div className="card">
            <div className="card-header flex-between">
                <div>
                    <h3 className="card-title">Keywords</h3>
                    <p className="card-subtitle">{keywords.length} tagged</p>
                </div>
                <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowPicker(!showPicker)}
                >
                    {showPicker ? 'Cancel' : '+ Add Keywords'}
                </button>
            </div>

            {/* Existing Keywords */}
            {keywords.length > 0 ? (
                <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                    {keywords.map((kw, idx) => (
                        <div
                            key={idx}
                            className={`tag ${kw.confirmedRelevant === true ? 'tag-positive' : kw.confirmedRelevant === false ? 'tag-negative' : ''}`}
                            title={`Added ${formatDate(kw.addedAt, { relative: true })}`}
                        >
                            {kw.keyword}
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-muted text-sm">No keywords tagged yet</p>
            )}

            {/* Keyword Picker */}
            {showPicker && (
                <div style={{
                    marginTop: 'var(--spacing-lg)',
                    paddingTop: 'var(--spacing-lg)',
                    borderTop: '1px solid var(--border-color)'
                }}>
                    {/* Category Tabs */}
                    <div className="flex gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
                        {categories.map((category) => (
                            <button
                                key={category}
                                className={`btn btn-sm ${activeCategory === category ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                                style={{ textTransform: 'capitalize' }}
                            >
                                {category}
                            </button>
                        ))}
                    </div>

                    {/* Keywords Grid */}
                    {activeCategory && keywordGroups[activeCategory] && (
                        <div className="flex gap-sm mb-md" style={{ flexWrap: 'wrap' }}>
                            {keywordGroups[activeCategory]
                                .filter(kw => !existingKeywords.includes(kw.keyword))
                                .map((kw) => (
                                    <button
                                        key={kw._id}
                                        className={`tag ${selectedKeywords.includes(kw.keyword) ? 'tag-positive' : ''}`}
                                        onClick={() => handleToggleKeyword(kw.keyword)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {selectedKeywords.includes(kw.keyword) && '✓ '}
                                        {kw.displayLabel || kw.keyword}
                                    </button>
                                ))}
                        </div>
                    )}

                    {/* Selected Summary */}
                    {selectedKeywords.length > 0 && (
                        <div className="flex-between mt-md">
                            <span className="text-sm text-secondary">
                                {selectedKeywords.length} keyword(s) selected
                            </span>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={handleSubmit}
                            >
                                Add Keywords
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default CustomerKeywords;
