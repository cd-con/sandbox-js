
class ComponentManager{
    #components;
    constructor(){
        this.ComponentManager = this;
        this.#components = [];
    }

    addComponent(component){
        this.#components.push(component);
    }

    getComponent(typeOfComponent){
        for(const component of this.#components) {
            if (component instanceof typeOfComponent){
                return component;
            }
        };
    }

    getComponents(typeOfComponent){
        let componentsFound = []
        for(const component of this.#components) {
            if (component instanceof typeOfComponent){
                componentsFound.push(component);
            }
        };
        return componentsFound;
    }

    isComponentPresent(componentType){
        return !(this.getComponent(componentType) === null);
    }

    isUniqueComponent(componentType){
        return this.getComponents(componentType).length == 1
    }
}