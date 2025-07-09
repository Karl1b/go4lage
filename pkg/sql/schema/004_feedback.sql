-- +goose Up
CREATE TABLE feedback (
    id UUID PRIMARY KEY NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,   
    full_url TEXT, -- the current url
    behaviour_is TEXT,
    behaviour_should TEXT,
    is_solved BOOLEAN DEFAULT false, 
    chat TEXT -- JSON
);

-- +goose Down
DROP TABLE feedback;
