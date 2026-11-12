import { useCallback, useEffect } from "react";
export const useMotionObserver = () => {
    useEffect(() => {
        const motionConfigs = [
            {
                selector: ".motion_target1",
                callback: (entries: IntersectionObserverEntry[]) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add("on");
                        } else {
                            // entry.target.classList.remove("on");
                        }
                    });
                },
            },
            {
                selector: ".motion_target2",
                callback: (entries: IntersectionObserverEntry[]) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add("on");
                            const items = entry.target.querySelectorAll(".target");
                            items.forEach((item, index) => {
                                setTimeout(() => item.classList.add("animate"), index * 180);
                            });
                        } else {
                            entry.target.classList.remove("on");
                            entry.target.querySelectorAll(".target").forEach((item) => {
                                item.classList.remove("animate");
                            });
                        }
                    });
                },
            },
        ];

        const observers: IntersectionObserver[] = [];

        motionConfigs.forEach(({ selector, callback }) => {
            const targets = document.querySelectorAll(selector);
            if (targets.length > 0) {
                const observer = new IntersectionObserver(callback, {
                    threshold: 0.1,
                    rootMargin: "0px",
                });
                targets.forEach((target) => observer.observe(target));
                observers.push(observer);
            }
        });

        const motion3Targets = document.querySelectorAll(".motion_target3");
        const motion4Targets = document.querySelectorAll(".motion_target4");
        const handleScroll = () => {
            motion3Targets.forEach((target) => {
                const rect = target.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                // console.log(rect, windowHeight)

                const elementTop = rect.top;
                const elementHeight = rect.height;

                let num = 0;

                if (elementTop < windowHeight && elementTop + elementHeight > 0) {
                    const viewArea = Math.min(windowHeight - elementTop, elementHeight); //둘 중 더 작은 값 반환
                    num = Math.max(0, Math.min(1, viewArea / elementHeight));
                }
                (target as HTMLElement).style.opacity = num.toString();
            });
            motion4Targets.forEach((target) => {
                const rect = target.getBoundingClientRect();
                const windowHeight = window.innerHeight;

                const elementTop = rect.top;
                const elementHeight = rect.height;

                let num = 0;

                if (elementTop < windowHeight && elementTop + elementHeight > 0) {
                    const viewArea = Math.min(windowHeight - elementTop, elementHeight);
                    num = Math.max(0, Math.min(1, viewArea / elementHeight));
                }
                (target as HTMLElement).style.opacity = num.toString();
                (target as HTMLElement).style.transform = `translateY(${(1 - num) * 50}px)`;
            });
        };

        return () => {
            observers.forEach((observer) => observer.disconnect());
        };
    }, []);
};
