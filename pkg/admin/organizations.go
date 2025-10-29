package admin

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
	cache "github.com/karl1b/go4lage/pkg/cache"
	"github.com/karl1b/go4lage/pkg/sql/db"

	utils "github.com/karl1b/go4lage/pkg/utils"
)

func (app *App) CreateOrganization(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	type RequestBody struct {
		OrganizationName string `json:"organization_name"`
		Email            string `json:"email"`
		ActiveUntil      string `json:"active_until"`
	}

	var reqBody RequestBody
	err = json.Unmarshal(body, &reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	activeUntil, err := time.Parse(time.DateOnly, reqBody.ActiveUntil)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error parsing time",
			Error:  err.Error(),
		})
		return
	}

	organization, err := app.Queries.OrganizationCreate(context.Background(), db.OrganizationCreateParams{
		ID: pgtype.UUID{
			Bytes: uuid.New(),
			Valid: true,
		},
		OrganizationName: reqBody.OrganizationName,
		Email:            reqBody.Email,
		ActiveUntil: pgtype.Timestamptz{
			Time:  activeUntil,
			Valid: true,
		},
	})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error creating organization",
			Error:  err.Error(),
		})
		return
	}

	utils.RespondWithJSON(w, organization)
}

func (app *App) DeleteOrganization(w http.ResponseWriter, r *http.Request) {
	organizationId := r.Header.Get("Id")
	organizationUUID, err := uuid.Parse(organizationId)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Cannot parse organization ID",
			Error:  err.Error(),
		})
		return
	}

	err = app.Queries.OrganizationDeleteByID(context.Background(), pgtype.UUID{
		Bytes: organizationUUID,
		Valid: true,
	})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error deleting organization",
			Error:  err.Error(),
		})
		return
	}

	cache.Go4Organizations.Del(organizationUUID)
	utils.RespondWithJSON(w, struct{}{})
}

func (app *App) EditOrganization(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer r.Body.Close()

	type RequestBody struct {
		OrganizationName string `json:"organization_name"`
		Email            string `json:"email"`
		ActiveUntil      string `json:"active_until"`
	}

	var reqBody RequestBody
	err = json.Unmarshal(body, &reqBody)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	id := r.Header.Get("Id")
	organizationUUID, err := uuid.Parse(id)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error parsing ID",
			Error:  err.Error(),
		})
		return
	}

	newActiveUntil, err := time.Parse(time.RFC3339, reqBody.ActiveUntil)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error parsing time",
			Error:  err.Error(),
		})
		return
	}

	user, ok := r.Context().Value(utils.InfoContextKey).(utils.InfoKey)
	if !ok {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "User not found in context",
			Error:  "user not found",
		})
		return
	}

	if !user.User.IsSuperuser.Bool {
		organizationUUID = uuid.UUID(user.Organization.ID.Bytes)
	}

	_, err = app.Queries.OrganizationUpdateById(context.Background(), db.OrganizationUpdateByIdParams{
		ID: pgtype.UUID{
			Bytes: organizationUUID,
			Valid: true,
		},
		OrganizationName: reqBody.OrganizationName,
		Email:            reqBody.Email,
		ActiveUntil: pgtype.Timestamptz{
			Time:  newActiveUntil,
			Valid: true,
		},
	})
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error updating organization",
			Error:  err.Error(),
		})
		return
	}

	cache.Go4Organizations.Del(organizationUUID)
	utils.RespondWithJSON(w, utils.ToastResponse{
		Header: "Organization updated",
		Text:   "",
	})
}

func (app *App) AllOrganizations(w http.ResponseWriter, r *http.Request) {

	rinfo, ok := r.Context().Value(utils.InfoContextKey).(utils.InfoKey)
	if !ok {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "User not found in context",
			Error:  "user not found",
		})
		return
	}

	type OrganizationResponse struct {
		ID               uuid.UUID `json:"id"`
		CreatedAt        time.Time `json:"created_at"`
		OrganizationName string    `json:"organization_name"`
		Email            string    `json:"email"`
		ActiveUntil      time.Time `json:"active_until"`
	}

	var Response []OrganizationResponse
	var organizations []db.Organization
	var err error

	if rinfo.User.IsSuperuser.Bool {
		organizations, err = app.Queries.OrganizationAll(context.Background())
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error getting all organizations",
				Error:  err.Error(),
			})
			return
		}
	} else {
		organizations = append(organizations, rinfo.Organization)
	}

	for _, org := range organizations {
		r := OrganizationResponse{
			ID:               uuid.UUID(org.ID.Bytes),
			CreatedAt:        org.CreatedAt.Time,
			OrganizationName: org.OrganizationName,
			Email:            org.Email,
			ActiveUntil:      org.ActiveUntil.Time,
		}

		Response = append(Response, r)
	}

	utils.RespondWithJSON(w, Response)
}

func (app *App) OneOrganization(w http.ResponseWriter, r *http.Request) {

	rinfo, ok := r.Context().Value(utils.InfoContextKey).(utils.InfoKey)
	if !ok {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "User not found in context",
			Error:  "user not found",
		})
		return
	}

	id := r.Header.Get("Id")
	organizationUUID, err := uuid.Parse(id)
	if err != nil {
		utils.RespondWithJSON(w, utils.ErrorResponse{
			Detail: "Error parsing ID",
			Error:  err.Error(),
		})
		return
	}
	var organization db.Organization
	if rinfo.User.IsSuperuser.Bool {

		organization, err = app.Queries.OrganizationSelectById(context.Background(), pgtype.UUID{
			Bytes: organizationUUID,
			Valid: true,
		})
		if err != nil {
			utils.RespondWithJSON(w, utils.ErrorResponse{
				Detail: "Error getting organization",
				Error:  err.Error(),
			})
			return
		}
	} else {
		organization = rinfo.Organization
	}

	type OrganizationResponse struct {
		ID               uuid.UUID `json:"id"`
		CreatedAt        time.Time `json:"created_at"`
		OrganizationName string    `json:"organization_name"`
		Email            string    `json:"email"`
		ActiveUntil      time.Time `json:"active_until"`
	}

	response := OrganizationResponse{
		ID:               uuid.UUID(organization.ID.Bytes),
		CreatedAt:        organization.CreatedAt.Time,
		OrganizationName: organization.OrganizationName,
		Email:            organization.Email,
		ActiveUntil:      organization.ActiveUntil.Time,
	}

	utils.RespondWithJSON(w, response)
}
