package com.aimmovie.car

import android.app.Application

/** AppContainer 를 프로세스 수명 동안 하나만 보유한다. ViewModel 팩토리가 `application.container` 로 꺼내 쓴다. */
class AimMovieApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
