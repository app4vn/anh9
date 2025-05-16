// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.3/firebase-app.js";
import { 
    getFirestore, collection, getDocs, query, orderBy, 
    doc, setDoc, getDoc, deleteDoc, Timestamp, where
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-firestore-lite.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.7.3/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCQIoJsPNVBfJR2vKLDwmrNl3qKXXqYMd0", 
  authDomain: "engcard-7782.firebaseapp.com",
  projectId: "engcard-7782",
  storageBucket: "engcard-7782.firebasestorage.app",
  messagingSenderId: "862442232694",
  appId: "1:862442232694:web:7868c6bd222ba0a7a83857"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements (Lấy từ "bản chuẩn" bạn cung cấp, đảm bảo không trùng lặp)
    const mainAppTitle = document.getElementById('mainAppTitle');
    const authView = document.getElementById('authView');
    const userStatusView = document.getElementById('userStatusView');
    const userInfo = document.getElementById('userInfo');
    const logoutBtn = document.getElementById('logoutBtn');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const authMessage = document.getElementById('authMessage');
    const unitListContainer = document.getElementById('unitListContainer');
    const unitSelectionView = document.getElementById('unitSelectionView');
    const unitActionsView = document.getElementById('unitActionsView');
    const unitActionsTitle = document.getElementById('unitActionsTitle');
    const flashcardView = document.getElementById('flashcardView');
    const quizView = document.getElementById('quizView');
    const startFlashcardBtn = document.getElementById('startFlashcardBtn');
    const startQuizBtn = document.getElementById('startQuizBtn');
    const backToUnitsFromActionsBtn = document.getElementById('backToUnitsFromActionsBtn');
    const flashcardUnitTitle = document.getElementById('flashcardUnitTitle');
    const flashcardContainer = document.getElementById('flashcardContainer');
    const flashcard = document.getElementById('flashcard');
    const fcWord = document.getElementById('fcWord');
    const fcPronunciation = document.getElementById('fcPronunciation');
    const fcImage = document.getElementById('fcImage');
    const fcPartOfSpeech = document.getElementById('fcPartOfSpeech');
    const fcMeaning = document.getElementById('fcMeaning');
    const fcExampleEn = document.getElementById('fcExampleEn');
    const fcExampleVi = document.getElementById('fcExampleVi');
    const flipCardBtn = document.getElementById('flipCardBtn');
    const prevCardBtn = document.getElementById('prevCardBtn');
    const nextCardBtn = document.getElementById('nextCardBtn'); // Nút "Tiếp" của Flashcard
    const wordCounter = document.getElementById('wordCounter');
    const backToActionsFromFlashcardBtn = document.getElementById('backToActionsFromFlashcardBtn');
    
    const wordStatusControlsContainer = document.getElementById('wordStatusControlsContainer');
    const statusMarkLearningBtn = document.getElementById('statusMarkLearningBtn');
    const statusMarkMasteredBtn = document.getElementById('statusMarkMasteredBtn');
    const statusClearBtn = document.getElementById('statusClearBtn');
    
    const flashcardFilterRadios = document.querySelectorAll('input[name="flashcardFilter"]');

    const quizUnitTitle = document.getElementById('quizUnitTitle');
    const quizProgress = document.getElementById('quizProgress');
    const quizQuestionWrapper = document.getElementById('quizQuestionWrapper');
    const questionArea = document.getElementById('questionArea');
    const optionsContainer = document.getElementById('optionsContainer');
    const feedbackArea = document.getElementById('feedbackArea'); 
    const nextQuestionBtn = document.getElementById('nextQuestionBtn'); // Nút "Câu tiếp theo" của Quiz
    const scoreArea = document.getElementById('scoreArea');
    const backToActionsFromQuizBtn = document.getElementById('backToActionsFromQuizBtn');
    const fcPlayAudioBtn = document.getElementById('fcPlayAudioBtn');

    // Global variables
    let vocabularyDataGlobal = null;
    let currentUnitNumberGlobal = null;
    let currentUser = null;
    let currentWordsInUnit_FC = [];
    let currentWordIndex_FC = 0;
    let quizQuestions = [];
    let currentQuestionIndex_Quiz = 0;
    let score_Quiz = 0;
    const NUM_QUIZ_QUESTIONS = 5;
    const NUM_QUIZ_OPTIONS = 4;
    const FADE_DURATION = 200;
    const QUIZ_FADE_DURATION = 250;

    // Biến cho tính năng trì hoãn và đếm ngược nút "Tiếp" của Flashcard
    let currentFlashcardSessionFilter = 'all'; 
    let nextButtonDelayTimer = null;
    let countdownIntervalId = null; 

    // --- Các hàm Authentication ---
    function displayAuthMessage(message, isError = false) {
        if(!authMessage) return;
        authMessage.textContent = message;
        authMessage.className = isError ? 'error' : 'success';
        authMessage.style.display = 'block';
        setTimeout(() => { authMessage.style.display = 'none'; authMessage.textContent = '';}, 3000);
    }

    if (registerBtn) { 
        registerBtn.addEventListener('click', async () => {
            if(!emailInput || !passwordInput) return;
            const email = emailInput.value;
            const password = passwordInput.value;
            if (!email || !password) {
                displayAuthMessage("Vui lòng nhập email và mật khẩu.", true);
                return;
            }
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                displayAuthMessage("Đăng ký thành công! Đang chuyển hướng...", false);
            } catch (error) {
                displayAuthMessage(`Lỗi đăng ký: ${error.message}`, true);
            }
        });
    }
    if (loginBtn) { 
        loginBtn.addEventListener('click', async () => {
            if(!emailInput || !passwordInput) return;
            const email = emailInput.value;
            const password = passwordInput.value;
             if (!email || !password) {
                displayAuthMessage("Vui lòng nhập email và mật khẩu.", true);
                return;
            }
            try {
                await signInWithEmailAndPassword(auth, email, password);
                displayAuthMessage("Đăng nhập thành công! Đang tải dữ liệu...", false);
            } catch (error) {
                displayAuthMessage(`Lỗi đăng nhập: ${error.message}`, true);
            }
        });
     } 
    if (logoutBtn) { 
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
            } catch (error) {
                displayAuthMessage(`Lỗi đăng xuất: ${error.message}`, true);
            }
        });
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            if(userInfo) userInfo.textContent = `Chào, ${user.email}!`;
            if (!vocabularyDataGlobal) {
                initializeAppVocabulary();
            }
            showView(unitSelectionView);
        } else {
            currentUser = null;
            if(userInfo) userInfo.textContent = '';
            vocabularyDataGlobal = null;
            currentWordsInUnit_FC = []; 
            quizQuestions = [];       
            if(unitListContainer) unitListContainer.innerHTML = '<div class="status-message">Vui lòng đăng nhập để học.</div>';
            if(wordStatusControlsContainer) wordStatusControlsContainer.style.display = 'none'; 
            
            if (nextButtonDelayTimer) { clearTimeout(nextButtonDelayTimer); nextButtonDelayTimer = null; }
            if (countdownIntervalId) { clearInterval(countdownIntervalId); countdownIntervalId = null; }
            if (nextCardBtn) nextCardBtn.textContent = 'Tiếp';

            showView(authView);
        }
    });
    
    // Hàm showView với logic ẩn/hiện tiêu đề đã thống nhất
    function showView(viewToShow) {
        [authView, unitSelectionView, unitActionsView, flashcardView, quizView].forEach(view => {
            if (view) view.style.display = 'none';
        });
    
        if (mainAppTitle) {
            mainAppTitle.style.display = (viewToShow === authView) ? 'block' : 'none';
        }
        if (userStatusView) {
            userStatusView.style.display = (currentUser && viewToShow === unitSelectionView) ? 'block' : 'none';
        }
    
        if (viewToShow) {
            viewToShow.style.display = 'block';
        }
    
        if (!currentUser && viewToShow !== authView) {
            if (authView) authView.style.display = 'block';
            if (viewToShow && viewToShow !== authView) viewToShow.style.display = 'none';
        } else if (currentUser && viewToShow === authView) {
            if (unitSelectionView) unitSelectionView.style.display = 'block';
            if (authView) authView.style.display = 'none';
        }
    }
    
    function shuffleArray(array) { 
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    } 
    async function loadVocabularyData() { 
        if (!db) { 
            console.error("Firebase Firestore SDK (db) not available.");
            if(unitListContainer) unitListContainer.innerHTML = `<div class="status-message">Lỗi cấu hình Firebase. <small>Không thể tải dữ liệu.</small></div>`;
            return null;
        }
        try {
            const vocabularyCollectionName = "vocabulary";
            const q = query(collection(db, vocabularyCollectionName), orderBy("unit", "asc"), orderBy("termNumber", "asc"));
            const querySnapshot = await getDocs(q);
            const vocabData = [];
            querySnapshot.forEach((doc) => {
                vocabData.push({ id: doc.id, ...doc.data() });
            });
            vocabularyDataGlobal = vocabData;
            if (vocabularyDataGlobal.length === 0) {
                if(unitListContainer) unitListContainer.innerHTML = `<div class="status-message">Không tìm thấy dữ liệu từ vựng. <small>Vui lòng kiểm tra collection '${vocabularyCollectionName}'.</small></div>`;
                return null;
            }
            return vocabularyDataGlobal;
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu từ Firestore:", error);
            if(unitListContainer) unitListContainer.innerHTML = `<div class="status-message">Không thể tải dữ liệu từ vựng. <small>${error.message}</small></div>`;
            return null;
        }
     } 
    function displayUnits(vocabularyData) { 
        if (!unitListContainer) return;
        if (!vocabularyData || vocabularyData.length === 0) {
            unitListContainer.innerHTML = '<div class="status-message">Không có dữ liệu từ vựng.</div>';
            return;
        }
        const units = {};
        vocabularyData.forEach(word => {
            if (word.unit && !units[word.unit]) {
                units[word.unit] = {
                    unitNumber: word.unit,
                    unitName_en: word.unitName_en || `Unit ${word.unit}`,
                    unitName_vi: word.unitName_vi || `Bài ${word.unit}`
                };
            }
        });
        const sortedUnits = Object.values(units).sort((a, b) => parseInt(a.unitNumber, 10) - parseInt(b.unitNumber, 10));
        unitListContainer.innerHTML = '';
        if (sortedUnits.length === 0) {
             unitListContainer.innerHTML = '<div class="status-message">Không có Unit nào để hiển thị.</div>';
             return;
        }
        sortedUnits.forEach(unit => {
            const unitElement = document.createElement('div');
            unitElement.classList.add('unit-item');
            unitElement.innerHTML = `
                <div class="unit-title-en">Unit ${unit.unitNumber}: ${unit.unitName_en}</div>
                <div class="unit-title-vi">${unit.unitName_vi}</div>
            `;
            unitElement.addEventListener('click', () => {
                showUnitOptions(unit); 
            });
            unitListContainer.appendChild(unitElement);
        });
    } 

    // CẬP NHẬT showUnitOptions để reset timer và filter
    function showUnitOptions(unit) { 
        if(!unitActionsTitle || !unit) return;
        unitActionsTitle.textContent = `Unit ${unit.unitNumber}: ${unit.unitName_en}`;
        currentUnitNumberGlobal = unit.unitNumber; 
        
        currentFlashcardSessionFilter = 'all'; 
        if (nextButtonDelayTimer) { 
            clearTimeout(nextButtonDelayTimer);
            nextButtonDelayTimer = null;
        }
        if (countdownIntervalId) { 
            clearInterval(countdownIntervalId);
            countdownIntervalId = null;
        }
        if (nextCardBtn) nextCardBtn.textContent = 'Tiếp'; 
        
        if (flashcardFilterRadios && flashcardFilterRadios.length > 0) {
            flashcardFilterRadios.forEach(radio => {
                radio.checked = (radio.value === 'all');
            });
        }
        showView(unitActionsView);
    }
    
    async function getWordStatus(userId, wordId) {
        if (!userId || !wordId) return 'new'; 
        const docId = `${userId}_${wordId}`;
        try {
            const docRef = doc(db, "userWordStatuses", docId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data().status || 'new';
            } else {
                return 'new'; 
            }
        } catch (error) {
            console.error("Lỗi khi lấy trạng thái từ:", error);
            return 'new'; 
        }
    }

    async function setWordStatus(userId, wordId, unitNumber, statusToSet) {
        if (!userId || !wordId || !unitNumber || !statusToSet) {
            console.error("Thiếu thông tin để cập nhật trạng thái từ.");
            return;
        }
        const docId = `${userId}_${wordId}`;
        const docRef = doc(db, "userWordStatuses", docId);

        try {
            if (statusToSet === 'new') { 
                await deleteDoc(docRef);
                console.log(`Trạng thái của từ ${wordId} đã được xóa.`);
            } else {
                await setDoc(docRef, {
                    userId: userId,
                    wordId: wordId,
                    unitNumber: String(unitNumber),
                    status: statusToSet,
                    lastUpdatedAt: Timestamp.now() 
                });
                console.log(`Trạng thái của từ ${wordId} được cập nhật thành: ${statusToSet}`);
            }
        } catch (error) {
            console.error("Lỗi khi cập nhật trạng thái từ:", error);
        }
    }

    function updateFlashcardStatusUI(currentStatus) { 
        if (!statusMarkLearningBtn || !statusMarkMasteredBtn || !statusClearBtn) return;
        [statusMarkLearningBtn, statusMarkMasteredBtn, statusClearBtn].forEach(btn => {
            btn.classList.remove('active-status');
        });
        if (currentStatus === 'learning') {
            statusMarkLearningBtn.classList.add('active-status');
        } else if (currentStatus === 'mastered') {
            statusMarkMasteredBtn.classList.add('active-status');
        }
     } 
    
    async function startFlashcardSession() { 
        if (!currentUser) {
            displayAuthMessage("Vui lòng đăng nhập để sử dụng tính năng này.", true);
            showView(authView);
            return;
        }
        if (!vocabularyDataGlobal || currentUnitNumberGlobal === null) {
            alert("Vui lòng chọn một Unit trước hoặc kiểm tra lại dữ liệu.");
            showView(unitSelectionView);
            return;
        }

        let selectedFilterValue = 'all';
        if (flashcardFilterRadios && flashcardFilterRadios.length > 0) {
            for (const radio of flashcardFilterRadios) {
                if (radio.checked) {
                    selectedFilterValue = radio.value;
                    break;
                }
            }
        }
        
        currentFlashcardSessionFilter = selectedFilterValue; // Lưu bộ lọc cho session
        
        let allWordsInUnit = vocabularyDataGlobal.filter(word => String(word.unit) === String(currentUnitNumberGlobal));
        let wordsForThisSession = [];

        if (selectedFilterValue === 'all') {
            wordsForThisSession = [...allWordsInUnit];
        } else {
            const loadingMessage = document.createElement('div');
            loadingMessage.textContent = 'Đang lọc từ theo trạng thái...';
            loadingMessage.classList.add('status-message'); 
            if(unitActionsView && unitActionsView.parentNode && unitActionsView.nextSibling) { 
                unitActionsView.parentNode.insertBefore(loadingMessage, unitActionsView.nextSibling);
            } else if (unitActionsView && unitActionsView.parentNode) {
                unitActionsView.parentNode.appendChild(loadingMessage);
            }

            for (const word of allWordsInUnit) {
                if (word.id) { 
                    const status = await getWordStatus(currentUser.uid, word.id); 
                    if (statusMatchesFilter(status, selectedFilterValue)) {
                        wordsForThisSession.push(word);
                    }
                }
            }
            if(loadingMessage && loadingMessage.parentNode) loadingMessage.remove();
        }

        if (wordsForThisSession.length > 0) {
            shuffleArray(wordsForThisSession);
            currentWordsInUnit_FC = wordsForThisSession;
            currentWordIndex_FC = 0;
            const firstWordData = currentWordsInUnit_FC[0] || allWordsInUnit[0];
            const unitNameEn = firstWordData?.unitName_en || `Unit ${currentUnitNumberGlobal}`;
            const filterTextMap = { 'all': 'tất cả', 'new': 'từ mới', 'learning': 'đang học', 'mastered': 'đã thuộc'};
            const filterDisplayText = filterTextMap[selectedFilterValue] || selectedFilterValue;
            
            if(flashcardUnitTitle) flashcardUnitTitle.textContent = `Flashcards - Unit ${currentUnitNumberGlobal}: ${unitNameEn} (${filterDisplayText})`;
            
            if(flashcard) {
                flashcard.style.opacity = '0'; 
                setTimeout(() => {
                    displayCurrentFlashcard(); 
                    flashcard.style.opacity = '1'; 
                }, FADE_DURATION);
            } else {
                 displayCurrentFlashcard();
            }
            showView(flashcardView);
        } else {
            const filterTextMap = { 'all': 'tất cả', 'new': 'từ mới', 'learning': 'đang học', 'mastered': 'đã thuộc'};
            const filterDisplayText = filterTextMap[selectedFilterValue] || selectedFilterValue;
            alert(`Không có từ nào là "${filterDisplayText}" trong Unit này.`);
        }
    }

    function statusMatchesFilter(wordStatus, filterValue) { 
        if (filterValue === 'all') return true;
        return wordStatus === filterValue;
     } 

    // CẬP NHẬT displayCurrentFlashcard với logic đếm ngược đầy đủ
    async function displayCurrentFlashcard() { 
        if (nextButtonDelayTimer) {
            clearTimeout(nextButtonDelayTimer);
            nextButtonDelayTimer = null;
        }
        if (countdownIntervalId) { 
            clearInterval(countdownIntervalId);
            countdownIntervalId = null;
        }
        if(nextCardBtn) nextCardBtn.textContent = 'Tiếp'; 

        if (!currentWordsInUnit_FC || currentWordsInUnit_FC.length === 0 || !flashcard) {
            if(wordStatusControlsContainer) wordStatusControlsContainer.style.display = 'none'; 
            return;
        }
        const wordData = currentWordsInUnit_FC[currentWordIndex_FC];
        if (!wordData) { 
            console.error("wordData không tồn tại ở index:", currentWordIndex_FC);
            if(wordStatusControlsContainer) wordStatusControlsContainer.style.display = 'none'; 
            return;
        }
        flashcard.classList.remove('is-flipped');

        // Khôi phục đầy đủ phần hiển thị thông tin thẻ
        if (fcWord) { 
            fcWord.innerHTML = ''; 
            if (wordData.word) { 
                const textToDisplay = wordData.word;
                const wordsArray = textToDisplay.split(' ').filter(part => part.trim() !== '');
                wordsArray.forEach((wordPart, index) => {
                    const span = document.createElement('span');
                    span.textContent = wordPart;
                    span.classList.add('tts-word');
                    fcWord.appendChild(span);
                    if (index < wordsArray.length - 1) {
                        fcWord.appendChild(document.createTextNode(' '));
                    }
                });
            } else {
                fcWord.textContent = ''; 
            }
        } 
        if(fcPronunciation) fcPronunciation.textContent = wordData.pronunciation || "";
        if (fcImage) {
            if (wordData.image_url) {
                fcImage.src = wordData.image_url;
                fcImage.alt = wordData.word || "Hình ảnh minh họa";
                fcImage.style.display = 'block';
            } else {
                fcImage.style.display = 'none';
                fcImage.src = "";
            }
        }
        if(fcPartOfSpeech) fcPartOfSpeech.textContent = wordData.partOfSpeech ? `(${wordData.partOfSpeech})` : "";
        if(fcMeaning) fcMeaning.textContent = wordData.meaning_vi || "";
        if(fcExampleEn) {
            fcExampleEn.textContent = wordData.example_en || "";
            fcExampleEn.style.display = wordData.example_en ? 'block' : 'none';
        }
        if(fcExampleVi) {
            fcExampleVi.textContent = wordData.example_vi || "";
            fcExampleVi.style.display = wordData.example_vi ? 'block' : 'none';
        }

        updateFlashcardNavButtons(); 
        if(wordCounter) wordCounter.textContent = `Từ ${currentWordIndex_FC + 1} / ${currentWordsInUnit_FC.length}`;

        if (currentUser && wordStatusControlsContainer && wordData.id) {
            wordStatusControlsContainer.style.display = 'flex'; 
            const currentStatus = await getWordStatus(currentUser.uid, wordData.id); 
            updateFlashcardStatusUI(currentStatus);
        } else if (wordStatusControlsContainer) {
            wordStatusControlsContainer.style.display = 'none'; 
        }

        // Logic trì hoãn và đếm ngược nút "Tiếp"
        if (currentUser && (currentFlashcardSessionFilter === 'learning' || currentFlashcardSessionFilter === 'new')) {
            if (nextCardBtn && !nextCardBtn.disabled) { 
                nextCardBtn.disabled = true;
                
                let countdown = 10;
                if(nextCardBtn) nextCardBtn.textContent = `Tiếp (${countdown}s)`;
                
                countdownIntervalId = setInterval(() => {
                    countdown--;
                    if (nextCardBtn) { // Kiểm tra nút còn tồn tại
                        if (countdown > 0) {
                            nextCardBtn.textContent = `Tiếp (${countdown}s)`;
                        } else {
                            // clearInterval đã được gọi ở đầu hàm hoặc trong setTimeout chính
                            // Không cần gọi lại ở đây trừ khi muốn dừng ngay lập tức khi countdown = 0
                            // và setTimeout chưa kích hoạt.
                            // An toàn hơn là để setTimeout chính dọn dẹp.
                            // Nếu interval vẫn chạy mà nextButtonDelayTimer đã clear nó,
                            // thì nút text có thể kẹt ở (1s) hoặc (0s).
                            // Nên clearInterval ở đây khi countdown <=0 là hợp lý.
                            clearInterval(countdownIntervalId);
                            countdownIntervalId = null;
                            // Nút sẽ được kích hoạt và reset text bởi setTimeout dưới
                        }
                    } else { // Nếu nút không còn, xóa interval
                        clearInterval(countdownIntervalId);
                        countdownIntervalId = null;
                    }
                }, 1000);
                
                nextButtonDelayTimer = setTimeout(() => {
                    if (countdownIntervalId) { 
                        clearInterval(countdownIntervalId);
                        countdownIntervalId = null;
                    }
                    if (nextCardBtn) { 
                        nextCardBtn.disabled = false;
                        nextCardBtn.textContent = 'Tiếp'; 
                    }
                }, 10000); 
            }
        } 
    }
    
    function updateFlashcardNavButtons() { 
        if(prevCardBtn) prevCardBtn.disabled = currentWordIndex_FC === 0;
        if(nextCardBtn) nextCardBtn.disabled = currentWordIndex_FC >= currentWordsInUnit_FC.length - 1;
     } 
    function flipTheCard() { 
        if(flashcard) flashcard.classList.toggle('is-flipped');
    } 

    // Khôi phục Event listener cho fcPlayAudioBtn
    if (fcPlayAudioBtn && fcWord) { 
        fcPlayAudioBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            if (currentWordsInUnit_FC.length === 0 || !currentWordsInUnit_FC[currentWordIndex_FC]) return;
            const currentWordObject = currentWordsInUnit_FC[currentWordIndex_FC];
            const wordToSpeak = currentWordObject ? currentWordObject.word : null;

            if (wordToSpeak && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel(); 
                const utterance = new SpeechSynthesisUtterance(wordToSpeak);
                utterance.lang = 'en-US'; 
                utterance.rate = 0.9;
                utterance.pitch = 1.0;

                const wordSpans = fcWord.querySelectorAll('span.tts-word');
                wordSpans.forEach(span => span.classList.remove('highlight-tts'));

                utterance.onboundary = (e) => {
                    if (e.name !== 'word' && e.charIndex === undefined && e.charLength === undefined) return;                     
                    wordSpans.forEach(s => s.classList.remove('highlight-tts'));
                    let cumulativeLength = 0;
                    for (let i = 0; i < wordSpans.length; i++) {
                        const span = wordSpans[i];
                        const currentWordInSpan = span.textContent;
                        const wordLength = currentWordInSpan.length;
                        if (e.charIndex >= cumulativeLength && e.charIndex < cumulativeLength + wordLength) {
                            span.classList.add('highlight-tts');
                            break; 
                        }
                        cumulativeLength += wordLength;
                        if (i < wordSpans.length - 1) { 
                            cumulativeLength++; 
                        }
                    }
                };
                utterance.onend = () => {
                    setTimeout(() => {
                        wordSpans.forEach(span => span.classList.remove('highlight-tts'));
                    }, 150); 
                };
                utterance.onerror = (e) => {
                    console.error('Lỗi phát âm thanh TTS:', e);
                    wordSpans.forEach(span => span.classList.remove('highlight-tts'));
                };
                window.speechSynthesis.speak(utterance);
            } else if (!('speechSynthesis' in window)) {
                alert('Xin lỗi, trình duyệt của bạn không hỗ trợ tính năng phát âm thanh.');
            }
        });
    } 
    
    // --- (Toàn bộ các hàm Quiz giữ nguyên) ---
    function startQuiz() { /* ... */ }
    function generateQuizQuestions(wordsInUnit, allVocabulary) { /* ... */ return [];} 
    function displayCurrentQuizQuestion() { /* ... */ } 
    function handleAnswer(selectedAnswer, questionObject, clickedButton) { /* ... */ } 
    function showQuizResults() { /* ... */ } 

    if (statusMarkLearningBtn) { /* ... */ }
    if (statusMarkMasteredBtn) { /* ... */ }
    if (statusClearBtn) { /* ... */ }

    if(startFlashcardBtn) startFlashcardBtn.addEventListener('click', startFlashcardSession);
    if(startQuizBtn) startQuizBtn.addEventListener('click', startQuiz);
    if(flipCardBtn) flipCardBtn.addEventListener('click', flipTheCard);
    if(flashcardContainer) flashcardContainer.addEventListener('click', flipTheCard); 
    
    // CẬP NHẬT Event Listeners cho nút Flashcard để xóa timer và interval
    if(nextCardBtn) {
        nextCardBtn.addEventListener('click', () => {
            if (nextButtonDelayTimer) { clearTimeout(nextButtonDelayTimer); nextButtonDelayTimer = null; }
            if (countdownIntervalId) { clearInterval(countdownIntervalId); countdownIntervalId = null; }
            // Text nút đã được reset ở đầu displayCurrentFlashcard

            if (currentWordIndex_FC < currentWordsInUnit_FC.length - 1) {
                if(flashcard) flashcard.style.opacity = '0';
                setTimeout(() => {
                    currentWordIndex_FC++;
                    displayCurrentFlashcard(); 
                    if(flashcard) flashcard.style.opacity = '1';
                }, FADE_DURATION);
            }
        });
    }
    if(prevCardBtn) {
        prevCardBtn.addEventListener('click', () => {
            if (nextButtonDelayTimer) { clearTimeout(nextButtonDelayTimer); nextButtonDelayTimer = null; }
            if (countdownIntervalId) { clearInterval(countdownIntervalId); countdownIntervalId = null; }
            // Text nút đã được reset ở đầu displayCurrentFlashcard

            if (currentWordIndex_FC > 0) {
                if(flashcard) flashcard.style.opacity = '0';
                setTimeout(() => {
                    currentWordIndex_FC--;
                    displayCurrentFlashcard(); 
                    if(flashcard) flashcard.style.opacity = '1';
                }, FADE_DURATION);
            }
        });
    }
    if(backToActionsFromFlashcardBtn) { 
        backToActionsFromFlashcardBtn.addEventListener('click', () => {
            // Timer và interval sẽ được xóa trong handleBackToUnitActions -> showUnitOptions
            handleBackToUnitActions();
        });
    }

    function handleNextQuestionOrRestart() { /* ... */ } 
    if(nextQuestionBtn) nextQuestionBtn.addEventListener('click', handleNextQuestionOrRestart);
    
    // CẬP NHẬT handleBackToUnitActions để reset timer (thực ra showUnitOptions làm rồi)
    function handleBackToUnitActions() { 
        const currentUnitDetails = vocabularyDataGlobal?.find(word => String(word.unit) === String(currentUnitNumberGlobal));
        if (currentUser && currentUnitDetails) {
            showUnitOptions(currentUnitDetails); // showUnitOptions sẽ xóa timer/interval
        } else if (currentUser) {
            if (nextButtonDelayTimer) { clearTimeout(nextButtonDelayTimer); nextButtonDelayTimer = null; } 
            if (countdownIntervalId) { clearInterval(countdownIntervalId); countdownIntervalId = null; }
            if (nextCardBtn) nextCardBtn.textContent = 'Tiếp';
            currentFlashcardSessionFilter = 'all'; // Reset filter
            showView(unitSelectionView);
        } else {
            showView(authView);
        }
     } 
    if(backToUnitsFromActionsBtn) { 
        backToUnitsFromActionsBtn.addEventListener('click', () => {
            if (currentUser) {
                // Xóa timer và reset filter khi quay về hẳn danh sách units
                if (nextButtonDelayTimer) { clearTimeout(nextButtonDelayTimer); nextButtonDelayTimer = null; }
                if (countdownIntervalId) { clearInterval(countdownIntervalId); countdownIntervalId = null; }
                if (nextCardBtn) nextCardBtn.textContent = 'Tiếp';
                currentFlashcardSessionFilter = 'all'; 
                showView(unitSelectionView); 
            } else {
                showView(authView);
            }
       });
    } 
    if(backToActionsFromQuizBtn) { backToActionsFromQuizBtn.addEventListener('click', handleBackToUnitActions); }
    
    async function initializeAppVocabulary() { 
        if (!db) { return; }
        if(unitListContainer) unitListContainer.innerHTML = '<div class="status-message">Đang tải danh sách Unit...</div>';
        const data = await loadVocabularyData();
        if (data) {
            displayUnits(data);
        }
     } 
    if (auth.currentUser) { 
        currentUser = auth.currentUser; 
        if(userInfo) userInfo.textContent = `Chào, ${currentUser.email}!`;
        initializeAppVocabulary(); 
        showView(unitSelectionView);
    } else { 
        showView(authView); 
    } 
});
