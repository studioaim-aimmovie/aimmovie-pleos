import { useEffect } from "react";
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

        return () => {
            observers.forEach((observer) => observer.disconnect());
        };
    }, []);
};
