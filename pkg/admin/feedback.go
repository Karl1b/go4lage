package admin

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/karl1b/go4lage/pkg/sql/db"
	utils "github.com/karl1b/go4lage/pkg/utils"
)

// ChatMessage represents a single message in the feedback chat
type ChatMessage struct {
	Timestamp time.Time `json:"timestamp"`
	From      string    `json:"from"`
	Message   string    `json:"message"`
}

func (app *App) AllFeedBack(w http.ResponseWriter, _ *http.Request) {

	allFeedBack, err := app.Queries.FeedBackGetAll(context.Background())
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{Detail: "Error getting all feedback", Error: err.Error()})
		return
	}

	utils.RespondWithJSON(w, allFeedBack)
}

func (app *App) NewFeedBack(w http.ResponseWriter, r *http.Request) {

	infos, ok := r.Context().Value(utils.InfoContextKey).(utils.InfoKey)
	requestUser := infos.User

	if !ok {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Failed to get user from context",
			Error:  "failed to get user from context",
		})
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	type RequestBody struct {
		BehaviourIs     string `json:"behaviour_is"`
		BehaviourShould string `json:"behaviour_should"`
		FullUrl         string `json:"full_url"`
	}

	var reqBody RequestBody
	err = json.Unmarshal(body, &reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	feedBack, err := app.Queries.FeedBackCreate(context.Background(), db.FeedBackCreateParams{
		ID: pgtype.UUID{
			Bytes: uuid.New(),
			Valid: true,
		},
		CreatedBy: requestUser.ID,
		FullUrl: pgtype.Text{
			String: reqBody.FullUrl,
			Valid:  true,
		},
		BehaviourIs: pgtype.Text{
			String: reqBody.BehaviourIs,
			Valid:  true,
		},
		BehaviourShould: pgtype.Text{
			String: reqBody.BehaviourShould,
			Valid:  true,
		},
		Chat: pgtype.Text{},
	})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{Detail: "error creating feedback", Error: err.Error()})
	}

	utils.RespondWithJSON(w, feedBack)
}

// GetUserSpecificFeedBack retrieves all feedback entries created by the requesting user
func (app *App) GetUserSpecificFeedBack(w http.ResponseWriter, r *http.Request) {
	infos, ok := r.Context().Value(utils.InfoContextKey).(utils.InfoKey)
	requestUser := infos.User
	if !ok {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Failed to get user from context",
			Error:  "failed to get user from context",
		})
		return
	}

	userFeedback, err := app.Queries.FeedBackGetByUserId(context.Background(), requestUser.ID)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error getting user feedback",
			Error:  err.Error(),
		})
		return
	}

	utils.RespondWithJSON(w, userFeedback)
}

// UpdateFeedBackUser allows regular users to update their own feedback
func (app *App) UpdateFeedBackUser(w http.ResponseWriter, r *http.Request) {

	infos, ok := r.Context().Value(utils.InfoContextKey).(utils.InfoKey)
	requestUser := infos.User
	if !ok {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Failed to get user from context",
			Error:  "failed to get user from context",
		})
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	type RequestBody struct {
		ID      string `json:"id"`
		Message string `json:"message"`
	}

	var reqBody RequestBody
	err = json.Unmarshal(body, &reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	feedbackID, err := uuid.Parse(reqBody.ID)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Invalid feedback ID format",
			Error:  err.Error(),
		})
		return
	}

	// Get existing feedback to check ownership
	existingFeedback, err := app.Queries.FeedBackGetById(context.Background(), pgtype.UUID{
		Bytes: feedbackID,
		Valid: true,
	})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error getting feedback",
			Error:  err.Error(),
		})
		return
	}

	// Check if user owns this feedback
	if existingFeedback.CreatedBy.Bytes != requestUser.ID.Bytes {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Permission denied",
			Error:  "you can only update your own feedback",
		})
		return
	}

	// Parse existing chat or create new array
	var chatMessages []ChatMessage
	if existingFeedback.Chat.Valid && existingFeedback.Chat.String != "" {
		err = json.Unmarshal([]byte(existingFeedback.Chat.String), &chatMessages)
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error parsing existing chat",
				Error:  err.Error(),
			})
			return
		}
	}

	// Add new message
	newMessage := ChatMessage{
		Timestamp: time.Now(),
		From:      requestUser.Email, // or requestUser.Name if available
		Message:   reqBody.Message,
	}
	chatMessages = append(chatMessages, newMessage)

	// Convert back to JSON
	updatedChatJSON, err := json.Marshal(chatMessages)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error creating chat JSON",
			Error:  err.Error(),
		})
		return
	}

	// Validate JSON before saving
	var validationCheck []ChatMessage
	err = json.Unmarshal(updatedChatJSON, &validationCheck)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Invalid JSON format",
			Error:  err.Error(),
		})
		return
	}

	// Update feedback
	updatedFeedback, err := app.Queries.FeedBackUpdateChat(context.Background(), db.FeedBackUpdateChatParams{
		ID: pgtype.UUID{
			Bytes: feedbackID,
			Valid: true,
		},
		Chat: pgtype.Text{
			String: string(updatedChatJSON),
			Valid:  true,
		},
	})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error updating feedback",
			Error:  err.Error(),
		})
		return
	}

	utils.RespondWithJSON(w, updatedFeedback)
}

// UpdateFeedBackStaff allows staff members to update any feedback and close it
func (app *App) UpdateFeedBackStaff(w http.ResponseWriter, r *http.Request) {
	infos, ok := r.Context().Value(utils.InfoContextKey).(utils.InfoKey)
	requestUser := infos.User

	if !ok {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Failed to get user from context",
			Error:  "failed to get user from context",
		})
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	type RequestBody struct {
		ID       string `json:"id"`
		Message  string `json:"message,omitempty"`
		IsSolved *bool  `json:"is_solved,omitempty"`
	}

	var reqBody RequestBody
	err = json.Unmarshal(body, &reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	feedbackID, err := uuid.Parse(reqBody.ID)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Invalid feedback ID format",
			Error:  err.Error(),
		})
		return
	}

	// Get existing feedback
	existingFeedback, err := app.Queries.FeedBackGetById(context.Background(), pgtype.UUID{
		Bytes: feedbackID,
		Valid: true,
	})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error getting feedback",
			Error:  err.Error(),
		})
		return
	}

	var updatedFeedback db.Feedback

	// If there's a message, update the chat
	if reqBody.Message != "" {
		// Parse existing chat or create new array
		var chatMessages []ChatMessage
		if existingFeedback.Chat.Valid && existingFeedback.Chat.String != "" {
			err = json.Unmarshal([]byte(existingFeedback.Chat.String), &chatMessages)
			if err != nil {
				utils.RespondWithJSON(w, utils.ErrorResponse{
					Detail: "Error parsing existing chat",
					Error:  err.Error(),
				})
				return
			}
		}

		// Add new message
		newMessage := ChatMessage{
			Timestamp: time.Now(),
			From:      requestUser.Email + " (Staff)", // Mark as staff
			Message:   reqBody.Message,
		}
		chatMessages = append(chatMessages, newMessage)

		// Convert back to JSON
		updatedChatJSON, err := json.Marshal(chatMessages)
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error creating chat JSON",
				Error:  err.Error(),
			})
			return
		}

		// Validate JSON before saving
		var validationCheck []ChatMessage
		err = json.Unmarshal(updatedChatJSON, &validationCheck)
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Invalid JSON format",
				Error:  err.Error(),
			})
			return
		}

		// Update chat
		updatedFeedback, err = app.Queries.FeedBackUpdateChat(context.Background(), db.FeedBackUpdateChatParams{
			ID: pgtype.UUID{
				Bytes: feedbackID,
				Valid: true,
			},
			Chat: pgtype.Text{
				String: string(updatedChatJSON),
				Valid:  true,
			},
		})
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error updating feedback chat",
				Error:  err.Error(),
			})
			return
		}
	}

	// If solved status is provided, update it
	if reqBody.IsSolved != nil {
		if *reqBody.IsSolved {
			updatedFeedback, err = app.Queries.FeedBackMarkSolved(context.Background(), pgtype.UUID{
				Bytes: feedbackID,
				Valid: true,
			})
		} else {
			updatedFeedback, err = app.Queries.FeedBackMarkUnsolved(context.Background(), pgtype.UUID{
				Bytes: feedbackID,
				Valid: true,
			})
		}
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error updating feedback status",
				Error:  err.Error(),
			})
			return
		}
	}

	// If no changes were made, return the existing feedback
	if reqBody.Message == "" && reqBody.IsSolved == nil {
		updatedFeedback = existingFeedback
	}

	utils.RespondWithJSON(w, updatedFeedback)
}
