package geminicv

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/google/generative-ai-go/genai"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	db "github.com/karl1b/go4lage/pkg/sql/db"

	utils "github.com/karl1b/go4lage/pkg/utils"
	"github.com/ledongthuc/pdf"
	_ "github.com/lib/pq"
	"google.golang.org/api/option"
)

type gCVOptions struct {
	key           string
	cvrunsperuser int
	scantimeouts  int
	savedir       string
}

var options gCVOptions

func init() {

	godotenv.Load(".env")

	key := os.Getenv("GEMINIKEY")
	if key == "" {
		log.Fatal("GEMINIKEY is empty")
	}

	cvrunsperuser := os.Getenv("CVRUNS_PER_USER")
	cvrunsperuserInt, err := strconv.Atoi(cvrunsperuser)
	if err != nil {
		log.Fatal("Error parsing CVRUNS_PER_USER")
	}

	scantimeouts := os.Getenv("SCAN_TIMEOUT_SECONDS")
	scantimeoutsInt, err := strconv.Atoi(scantimeouts)
	if err != nil {
		log.Fatal("Error parsing SCAN_TIMEOUT_SECONDS")
	}

	options = gCVOptions{
		key:           key,
		cvrunsperuser: cvrunsperuserInt,
		scantimeouts:  scantimeoutsInt,
		savedir:       "./data",
	}

}

type GeApp struct {
	Queries *db.Queries
}

func (app *GeApp) Test(w http.ResponseWriter, r *http.Request) {
	utils.RespondWithJSON(w, 200, struct{}{})
}

// Read run
func (app *GeApp) Run(w http.ResponseWriter, r *http.Request) {

	user, ok := r.Context().Value(utils.UserKey{}).(db.User)
	if !ok {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "User not found in context",
			Error:  errors.New("user not found"),
		})
		return
	}

	cVrunId := r.Header.Get("CVrunID")
	cvrunuuid, err := uuid.Parse(cVrunId)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error parsing uuid",
			Error:  err,
		})
	}

	cvrun, err := app.Queries.ReadCVrun(context.Background(), cvrunuuid)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error parsing uuid",
			Error:  err,
		})
	}

	_, err = app.Queries.CheckCVrunUser(context.Background(), db.CheckCVrunUserParams{
		UserID:  user.ID,
		CvrunID: cvrun.ID,
	})

	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error is this User owner of the run?",
			Error:  err,
		})
	}

	allruns, err := app.Queries.SelectAllCVRunScans(context.Background(), cvrunuuid)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error getting all runs",
			Error:  err,
		})
	}

	type Response struct {
		ID                     string `json:"id"`
		Text                   string `json:"text"`
		StartVersion           bool   `json:"start_version"`
		AnualGrossSalaryMin    int    `json:"anual_gross_salary_min"`
		AnualGrossSalaryAvg    int    `json:"anual_gross_salary_avg"`
		AnualGrossSalaryMax    int    `json:"anual_gross_salary_max"`
		HourlyFreelanceRateMin int    `json:"hourly_freelance_rate_min"`
		HourlyFreelanceRateAvg int    `json:"hourly_freelance_rate_avg"`
		HourlyFreelanceRateMax int    `json:"hourly_freelance_rate_max"`
		NextCareerStep         string `json:"next_career_step"`
		Lang                   string `json:"language"`
	}

	var response []Response

	for _, run := range allruns {

		filename := fmt.Sprintf("%s.txt", run.ID.String()) // Assuming run.ID is the UUID
		fullPath := filepath.Join(options.savedir, filename)
		textBytes, err := os.ReadFile(fullPath)
		if err != nil {
			fmt.Println(err)
			continue
		}

		item := Response{
			ID:                     run.ID.String(),
			Text:                   string(textBytes),
			StartVersion:           run.StartVersion.Bool,
			AnualGrossSalaryMin:    int(run.AnualGrossSalaryMin.Int32),
			AnualGrossSalaryAvg:    int(run.AnualGrossSalaryAvg.Int32),
			AnualGrossSalaryMax:    int(run.AnualGrossSalaryMax.Int32),
			HourlyFreelanceRateMin: int(run.HourlyFreelanceRateMin.Int32),
			HourlyFreelanceRateAvg: int(run.HourlyFreelanceRateAvg.Int32),
			HourlyFreelanceRateMax: int(run.HourlyFreelanceRateMax.Int32),
			NextCareerStep:         run.NextCareerStep.String,
			Lang:                   run.Lang.String,
		}

		response = append(response, item)

	}

	utils.RespondWithJSON(w, 200, response)
}

func (app *GeApp) getAllRuns(userId uuid.UUID) (allRunResponse AllRunResponse, err error) {
	allCvruns, err := app.Queries.SelectAllCVrunsForUser(context.Background(), userId)
	if err != nil {
		return allRunResponse, err
	}

	for _, run := range allCvruns {
		rundetail, err := app.Queries.ReadCVrun(context.Background(), run.CvrunID)
		if err != nil {
			return allRunResponse, err
		}
		rundetailres := Run{
			ID:        rundetail.ID,
			Timestamp: rundetail.Timestamp.Time,
		}
		allRunResponse.Runs = append(allRunResponse.Runs, rundetailres)
	}

	userRuns, err := app.Queries.CountUserRuns(context.Background(), userId)
	if err != nil {
		return allRunResponse, err
	}
	allRunResponse.CurrentRuns = userRuns
	allRunResponse.MaxRuns = options.cvrunsperuser
	return allRunResponse, nil
}

type Run struct {
	ID        uuid.UUID `json:"id"`
	Timestamp time.Time `json:"timestamp"`
}

type AllRunResponse struct {
	Runs        []Run `json:"runs"`
	MaxRuns     int   `json:"max_runs"`
	CurrentRuns int64 `json:"current_runs"`
}

func (app *GeApp) Allruns(w http.ResponseWriter, r *http.Request) {

	user, ok := r.Context().Value(utils.UserKey{}).(db.User)
	if !ok {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "User not found in context",
			Error:  errors.New("user not found"),
		})
		return
	}

	response, err := app.getAllRuns(user.ID)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error to get all runs",
			Error:  err,
		})
		return
	}

	utils.RespondWithJSON(w, 200, response)
}

// workflow

func (app *GeApp) UploadCV(w http.ResponseWriter, r *http.Request) {

	user, ok := r.Context().Value(utils.UserKey{}).(db.User)
	if !ok {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "User not found in context",
			Error:  errors.New("user not found"),
		})
		return
	}

	userRuns, err := app.Queries.CountUserRuns(context.Background(), user.ID)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Count failed",
			Error:  err,
		})
		return
	}

	if userRuns >= int64(options.cvrunsperuser) {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "too many runs",
			Error:  errors.New("too many runs"),
		})
		return
	}

	if err := r.ParseMultipartForm(20 << 20); err != nil {

		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "File too big",
			Error:  errors.New("file too big"),
		})
		return

	}

	file, _, err := r.FormFile("upload")
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Invalid file",
			Error:  errors.New("invalid file"),
		})
		return

	}
	defer file.Close()

	// Read the file content
	fileBytes, err := io.ReadAll(file)
	if err != nil {

		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Failed to read file",
			Error:  errors.New("failed to read file"),
		})
		return

	}

	// Parse PDF to text
	text, err := pdfToText(fileBytes)
	if err != nil {

		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Failed to parse pdf",
			Error:  errors.New("failed to parse pdf"),
		})
		return

	}
	text, err = cleanText(text)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error Cleaning Text",
			Error:  err,
		})
		return
	}
	newuuid := uuid.New()

	run, err := app.Queries.CreateCVRun(context.Background(), newuuid)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Failed to create run",
			Error:  err,
		})
		return

	}

	err = app.Queries.LinkUserToCVRun(context.Background(), db.LinkUserToCVRunParams{
		UserID:  user.ID,
		CvrunID: run.ID,
	})
	if err != nil {

		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Failed to link user and run",
			Error:  err,
		})
		return
	}

	go analyseCV(text, run, app.Queries)

	response, err := app.getAllRuns(user.ID)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "User not found in context",
			Error:  errors.New("failed to get all CV runs"),
		})
		return
	}

	utils.RespondWithJSON(w, 200, response)

}

func (app *GeApp) UploadText(w http.ResponseWriter, r *http.Request) {

	user, ok := r.Context().Value(utils.UserKey{}).(db.User)
	if !ok {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "User not found in context",
			Error:  errors.New("user not found"),
		})
		return
	}

	userRuns, err := app.Queries.CountUserRuns(context.Background(), user.ID)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Count failed",
			Error:  err,
		})
		return
	}

	if userRuns >= int64(options.cvrunsperuser) {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "too many runs",
			Error:  errors.New("too many runs"),
		})
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Empty body",
			Error:  errors.New("empty body"),
		})

		return
	}
	defer r.Body.Close()

	type RequestBody struct {
		Text string `json:"text"`
	}

	var reqBody RequestBody
	err = json.Unmarshal(body, &reqBody)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Wrong body",
			Error:  errors.New("wrong body"),
		})

		return
	}

	text := reqBody.Text

	text, err = cleanText(text)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error Cleaning Text",
			Error:  err,
		})
		return
	}

	newuuid := uuid.New()

	run, err := app.Queries.CreateCVRun(context.Background(), newuuid)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Failed to create run",
			Error:  err,
		})

		return
	}

	err = app.Queries.LinkUserToCVRun(context.Background(), db.LinkUserToCVRunParams{
		UserID:  user.ID,
		CvrunID: run.ID,
	})
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Failed to link user and run",
			Error:  err,
		})

		return
	}

	go analyseCV(text, run, app.Queries)

	response, err := app.getAllRuns(user.ID)
	if err != nil {
		utils.RespondWithJSON(w, 500, utils.ErrorResponse{
			Detail: "Error getting all runs",
			Error:  err,
		})
		return
	}
	utils.RespondWithJSON(w, 200, response)

}

func pdfToText(fileBytes []byte) (string, error) {
	reader, err := pdf.NewReader(bytes.NewReader(fileBytes), int64(len(fileBytes)))
	if err != nil {
		return "", err
	}

	var text string
	for pageIndex := 1; pageIndex <= reader.NumPage(); pageIndex++ {
		page := reader.Page(pageIndex)
		if page.V.IsNull() {
			continue
		}
		pageText, err := page.GetPlainText(nil)
		if err != nil {
			return "", err
		}
		text += pageText
	}

	return text, nil
}

func cleanText(text string) (string, error) {
	text = regexp.MustCompile(`(\n{3,})`).ReplaceAllString(text, "\n\n\n")
	text = regexp.MustCompile(`\*{1,2}`).ReplaceAllString(text, "")
	text = strings.TrimSpace(text)

	if len(text) >= 25000 {
		return "", errors.New("text too long")
	}

	return text, nil
}

// scanfile

func analyseCV(text string, run db.Cvrun, queries *db.Queries) {

	lang, err := detectLanguage(text)
	if err != nil {

		fmt.Println("Error detect language")
		fmt.Println(err)
		return
	}

	// waitgroup here

	// Launch the goroutines

	cvRunScan(lang, text, 1, queries, run, true)

	instructionOne := cvImproveOne.en
	instructionTwo := cvImproveTwo.en

	if lang == "de" {
		instructionOne = cvImproveOne.de
		instructionTwo = cvImproveTwo.de
	}

	go createImprovement(lang, text, 0.8, queries, run, instructionOne)
	go createImprovement(lang, text, 0.8, queries, run, instructionTwo)
	go createImprovement(lang, text, 0.65, queries, run, instructionOne)
	go createImprovement(lang, text, 0.65, queries, run, instructionTwo)

}

// DetectsLanguage and also is good to prevent prompt injection
func detectLanguage(text string) (string, error) {

	resp, err := callGemini(languageCheck.en, text, 0.9)
	fmt.Println(resp)
	if err != nil {
		return "en", err
	}

	type GeminiLangResponse struct {
		Lang string `json:"language"`
	}

	var langRespose GeminiLangResponse

	err = json.Unmarshal([]byte(resp), &langRespose)
	if err != nil {
		fmt.Println(err)
		return "", err
	}

	lang := langRespose.Lang

	if lang != "en" && lang != "de" {
		return "", errors.New("wrong language")
	}

	return lang, nil

}

func cvRunScan(lang string, text string, temp float32, queries *db.Queries, run db.Cvrun, isStartVersion bool) {

	instruction := cvCheck.en
	if lang == "de" {
		instruction = cvCheck.de
	}

	resp, err := callGemini(instruction, text, temp)
	if err != nil {
		fmt.Println("error call gemini")
		fmt.Println(err)
		return
	}

	fmt.Println(resp)

	type GeminiResponse struct {
		AnualGrossSalaryMin int `json:"anual_gross_salary_min"`
		AnualGrossSalaryAvg int `json:"anual_gross_salary_avg"`
		AnualGrossSalaryMax int `json:"anual_gross_salary_max"`

		HourlyFreelanceRateMin int `json:"hourly_freelance_rate_min"`
		HourlyFreelanceRateAvg int `json:"hourly_freelance_rate_avg"`
		HourlyFreelanceRateMax int `json:"hourly_freelance_rate_max"`

		NextCareerStep string `json:"next_career_step"`
	}

	var geminiResp GeminiResponse
	err = json.Unmarshal([]byte(resp), &geminiResp)
	if err != nil {
		fmt.Println(err)
		return
	}

	newUUID, err := uuid.NewUUID()
	if err != nil {
		fmt.Println(err)
		return
	}

	scan, err := queries.CreateCVRunScan(context.Background(), db.CreateCVRunScanParams{
		ID:                     newUUID,
		Filepath:               newUUID.String(),
		StartVersion:           sql.NullBool{Bool: isStartVersion, Valid: true},
		Lang:                   sql.NullString{String: lang, Valid: true},
		AnualGrossSalaryMin:    sql.NullInt32{Int32: int32(geminiResp.AnualGrossSalaryMin), Valid: true},
		AnualGrossSalaryAvg:    sql.NullInt32{Int32: int32(geminiResp.AnualGrossSalaryAvg), Valid: true},
		AnualGrossSalaryMax:    sql.NullInt32{Int32: int32(geminiResp.AnualGrossSalaryMax), Valid: true},
		HourlyFreelanceRateMin: sql.NullInt32{Int32: int32(geminiResp.HourlyFreelanceRateMin), Valid: true},
		HourlyFreelanceRateAvg: sql.NullInt32{Int32: int32(geminiResp.HourlyFreelanceRateAvg), Valid: true},
		HourlyFreelanceRateMax: sql.NullInt32{Int32: int32(geminiResp.HourlyFreelanceRateMax), Valid: true},
		NextCareerStep:         sql.NullString{String: geminiResp.NextCareerStep, Valid: true},
	})
	if err != nil {
		fmt.Println(err)
		return
	}
	fmt.Println("New scan created:", scan)

	filename := fmt.Sprintf("%s.txt", newUUID.String())
	fullPath := filepath.Join(options.savedir, filename)
	err = os.WriteFile(fullPath, []byte(text), 0644)
	if err != nil {
		fmt.Println(err)
		return
	}

	err = queries.LinkCVRunToCVRunScan(context.Background(), db.LinkCVRunToCVRunScanParams{
		CvrunID:     run.ID,
		CvrunscanID: scan.ID,
	})
	if err != nil {
		fmt.Println(err)
		return
	}

}

func createImprovement(lang string, text string, temp float32, queries *db.Queries, run db.Cvrun, instruction string) {

	// create improvement
	improvement, err := callGemini(instruction, text, temp)
	if err != nil {
		fmt.Println(err)
		return
	}

	improvement, _ = cleanText(improvement)

	// rate improvement
	cvRunScan(lang, improvement, 1, queries, run, false)

}

func callGemini(instruction, prompt string, temp float32) (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(options.scantimeouts)*time.Second)
	defer cancel()

	done := make(chan bool)
	resultChan := make(chan string)
	errChan := make(chan error)

	client, err := genai.NewClient(ctx, option.WithAPIKey(options.key))
	if err != nil {
		return "", fmt.Errorf("failed to create client: %v", err)
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-1.5-flash")
	model.SetTemperature(temp)
	model.SystemInstruction = &genai.Content{
		Parts: []genai.Part{genai.Text(instruction)},
	}
	go func() {
		resp, err := model.GenerateContent(ctx, genai.Text(prompt))
		if err != nil {
			errChan <- fmt.Errorf("failed to generate content: %v", err)
			return
		}

		if len(resp.Candidates) == 0 || len(resp.Candidates[0].Content.Parts) == 0 {
			errChan <- errors.New("no content generated")
			return
		}

		text, ok := resp.Candidates[0].Content.Parts[0].(genai.Text)
		if !ok {
			errChan <- errors.New("unexpected content type in response")
			return
		}

		resultChan <- string(text)
		done <- true
	}()

	select {
	case <-ctx.Done():
		return "", errors.New("operation timed out")
	case err := <-errChan:
		return "", err
	case result := <-resultChan:
		return result, nil
	}
}
